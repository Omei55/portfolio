import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { ProjectEntity } from './project.entity';
import { UserEntity } from '../../auth/entities/user.entity';

@Entity({ name: 'project_members' })
@Unique(['project_id', 'user_id'])
export class ProjectMemberEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'project_id', type: 'uuid' })
  project_id: string;

  @Column({ name: 'user_id', type: 'uuid' })
  user_id: string;

  @ManyToOne(() => ProjectEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'project_id' })
  project: ProjectEntity;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: UserEntity;

  @CreateDateColumn({ name: 'joined_at' })
  joined_at: Date;
}


