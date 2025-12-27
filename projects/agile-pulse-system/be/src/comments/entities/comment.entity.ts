import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { StoryEntity } from '../../stories/entities/story.entity';
import { TaskEntity } from '../../tasks/entities/task.entity';
import { UserEntity } from '../../auth/entities/user.entity';

@Entity({ name: 'comments' })
export class CommentEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text' })
  content: string;

  @Column({ name: 'story_id', nullable: true })
  story_id: string | null;

  @ManyToOne(() => StoryEntity, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'story_id' })
  story: StoryEntity | null;

  @Column({ name: 'task_id', nullable: true })
  task_id: string | null;

  @ManyToOne(() => TaskEntity, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'task_id' })
  task: TaskEntity | null;

  @Column({ name: 'user_id' })
  user_id: string;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: UserEntity;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at: Date;
}



