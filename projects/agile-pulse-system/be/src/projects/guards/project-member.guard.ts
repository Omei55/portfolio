import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { ProjectMemberEntity } from '../entities/project-member.entity';
import { ProjectEntity } from '../entities/project.entity';

@Injectable()
export class ProjectMemberGuard implements CanActivate {
  constructor(private database_service: DatabaseService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user_id = request.user?.user_id;
    const project_id = request.params?.projectId || request.params?.project_id;
    const method = request.method;

    if (!user_id || !project_id) {
      throw new ForbiddenException('Missing user or project information');
    }

    // First, check if project exists
    const project = await this.database_service.find_one(ProjectEntity, {
      where: { id: project_id },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    // Allow if user is the project creator
    if (project.created_by === user_id) {
      return true;
    }

    // Check if project has any members
    const all_members = await this.database_service.find(
      ProjectMemberEntity,
      {
        where: { project_id },
      },
    );

    // If project has no members yet, allow adding the first member (for POST requests)
    if (all_members.length === 0 && method === 'POST') {
      return true;
    }

    // Check if user is a project member
    const membership = await this.database_service.find_one(
      ProjectMemberEntity,
      {
        where: {
          project_id,
          user_id,
        },
      },
    );

    if (!membership) {
      throw new ForbiddenException(
        'Only project members can perform this action',
      );
    }

    return true;
  }
}


