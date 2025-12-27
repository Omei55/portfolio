import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DatabaseService } from '../database/database.service';
import { ProjectEntity } from './entities/project.entity';
import { ProjectMemberEntity } from './entities/project-member.entity';
import { UserEntity } from '../auth/entities/user.entity';
import { AddMemberDto } from './dto/add-member.dto';
import { CreateProjectDto } from './dto/create-project.dto';

@Injectable()
export class ProjectsService {
  constructor(
    private database_service: DatabaseService,
    @InjectRepository(UserEntity)
    private readonly users_repository: Repository<UserEntity>,
  ) {}

  async addMember(project_id: string, add_member_dto: AddMemberDto) {
    // Check if project exists
    const project = await this.database_service.find_one(ProjectEntity, {
      where: { id: project_id },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    // Check if user exists
    const user = await this.database_service.find_one(UserEntity, {
      where: { id: add_member_dto.user_id },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check if user is already a member
    const existing_member = await this.database_service.find_one(
      ProjectMemberEntity,
      {
        where: {
          project_id,
          user_id: add_member_dto.user_id,
        },
      },
    );

    if (existing_member) {
      throw new ConflictException('User is already a member of this project');
    }

    // Add member
    const project_member = await this.database_service.create_one(
      ProjectMemberEntity,
      {
        project_id,
        user_id: add_member_dto.user_id,
      },
    );

    return {
      id: project_member.id,
      user_id: project_member.user_id,
      project_id: project_member.project_id,
      joined_at: project_member.joined_at,
      message: 'Member added successfully',
    };
  }

  async removeMember(project_id: string, user_id: string) {
    // Check if project exists
    const project = await this.database_service.find_one(ProjectEntity, {
      where: { id: project_id },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    // Check if user exists
    const user = await this.database_service.find_one(UserEntity, {
      where: { id: user_id },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Find and remove membership
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
      throw new NotFoundException('User is not a member of this project');
    }

    await this.database_service.delete_one(ProjectMemberEntity, {
      where: {
        project_id,
        user_id,
      },
    });

    return {
      message: 'Member removed successfully',
      user_id,
      project_id,
    };
  }

  async getProjectMembers(project_id: string) {
    // Check if project exists
    const project = await this.database_service.find_one(ProjectEntity, {
      where: { id: project_id },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    // Get all members with user details
    const members = await this.database_service.find(ProjectMemberEntity, {
      where: { project_id },
      relations: ['user'],
    });

    return members.map((member) => ({
      id: member.id,
      user_id: member.user_id,
      project_id: member.project_id,
      joined_at: member.joined_at,
      user: {
        id: member.user.id,
        email: member.user.email,
        full_name: member.user.full_name,
        roles: member.user.roles,
        avatar_url: member.user.avatar_url,
      },
    }));
  }

  async searchUsers(query?: string) {
    const trimmed_query = query?.trim();

    if (!trimmed_query || trimmed_query.length === 0) {
      const users = await this.users_repository.find();
      return users.map((user) => ({
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        roles: user.roles,
        avatar_url: user.avatar_url,
      }));
    }

    const users = await this.users_repository
      .createQueryBuilder('user')
      .where('user.email ILIKE :search OR user.full_name ILIKE :search', {
        search: `%${trimmed_query}%`,
      })
      .getMany();

    return users.map((user) => ({
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      roles: user.roles,
      avatar_url: user.avatar_url,
    }));
  }

  async searchUsersNotInProject(project_id: string, query?: string) {
    // Check if project exists
    const project = await this.database_service.find_one(ProjectEntity, {
      where: { id: project_id },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    // Get all current project members
    const project_members = await this.database_service.find(
      ProjectMemberEntity,
      {
        where: { project_id },
      },
    );

    const member_user_ids = project_members.map((member) => member.user_id);

    const trimmed_query = query?.trim();

    let users_query = this.users_repository.createQueryBuilder('user');

    if (trimmed_query && trimmed_query.length > 0) {
      users_query = users_query.where(
        'user.email ILIKE :search OR user.full_name ILIKE :search',
        {
          search: `%${trimmed_query}%`,
        },
      );
    }

    const all_users = await users_query.getMany();

    // Filter out users who are already members
    const available_users = all_users.filter(
      (user) => !member_user_ids.includes(user.id),
    );

    return available_users.map((user) => ({
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      roles: user.roles,
      avatar_url: user.avatar_url,
    }));
  }

  async createProject(
    create_project_dto: CreateProjectDto,
    user_id?: string,
  ) {
    const project = await this.database_service.create_one(ProjectEntity, {
      name: create_project_dto.name,
      description: create_project_dto.description,
      created_by: user_id,
    });

    return {
      id: project.id,
      name: project.name,
      description: project.description,
      created_by: project.created_by,
      created_at: project.created_at,
      updated_at: project.updated_at,
    };
  }

  async getAllProjects() {
    const projects = await this.database_service.find(ProjectEntity, {
      order: { created_at: 'DESC' },
    });

    return projects.map((project) => ({
      id: project.id,
      name: project.name,
      description: project.description,
      created_by: project.created_by,
      created_at: project.created_at,
      updated_at: project.updated_at,
    }));
  }
}


