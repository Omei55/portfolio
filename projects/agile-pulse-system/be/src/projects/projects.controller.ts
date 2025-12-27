import {
  Controller,
  Post,
  Delete,
  Get,
  Param,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  Request,
} from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { AddMemberDto } from './dto/add-member.dto';
import { SearchUsersDto } from './dto/search-users.dto';
import { CreateProjectDto } from './dto/create-project.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ProjectMemberGuard } from './guards/project-member.guard';
import { ApiResponseDto } from '../common/dto/api-response.dto';

@Controller('api/projects')
@UseGuards(JwtAuthGuard)
export class ProjectsController {
  constructor(private readonly projects_service: ProjectsService) {}

  // Base route - must come before parameterized routes
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createProject(
    @Body() create_project_dto: CreateProjectDto,
    @Request() req: any,
  ): Promise<ApiResponseDto> {
    const user_id = req.user?.user_id || req.user?.sub || req.user?.id;
    const project = await this.projects_service.createProject(
      create_project_dto,
      user_id,
    );
    return ApiResponseDto.created(project, 'Project created successfully');
  }

  @Get()
  async getAllProjects(): Promise<ApiResponseDto> {
    const projects = await this.projects_service.getAllProjects();
    return ApiResponseDto.success(projects, 'Projects retrieved successfully');
  }

  // Specific routes - must come before parameterized routes
  @Get('users/search')
  async searchUsers(@Query() search_users_dto: SearchUsersDto): Promise<ApiResponseDto> {
    const users = await this.projects_service.searchUsers(search_users_dto.query);
    return ApiResponseDto.success(users, 'Users retrieved successfully');
  }

  // Parameterized routes
  @Post(':projectId/members')
  @UseGuards(ProjectMemberGuard)
  @HttpCode(HttpStatus.CREATED)
  async addMember(
    @Param('projectId') project_id: string,
    @Body() add_member_dto: AddMemberDto,
  ): Promise<ApiResponseDto> {
    const member = await this.projects_service.addMember(project_id, add_member_dto);
    return ApiResponseDto.created(member, 'Member added to project successfully');
  }

  @Delete(':projectId/members/:userId')
  @UseGuards(ProjectMemberGuard)
  @HttpCode(HttpStatus.OK)
  async removeMember(
    @Param('projectId') project_id: string,
    @Param('userId') user_id: string,
  ): Promise<ApiResponseDto> {
    const result = await this.projects_service.removeMember(project_id, user_id);
    return ApiResponseDto.success(result, 'Member removed from project successfully');
  }

  @Get(':projectId/members')
  async getProjectMembers(@Param('projectId') project_id: string): Promise<ApiResponseDto> {
    const members = await this.projects_service.getProjectMembers(project_id);
    return ApiResponseDto.success(members, 'Project members retrieved successfully');
  }

  @Get(':projectId/users/search')
  async searchUsersNotInProject(
    @Param('projectId') project_id: string,
    @Query() search_users_dto: SearchUsersDto,
  ): Promise<ApiResponseDto> {
    const users = await this.projects_service.searchUsersNotInProject(
      project_id,
      search_users_dto.query,
    );
    return ApiResponseDto.success(users, 'Available users retrieved successfully');
  }
}



