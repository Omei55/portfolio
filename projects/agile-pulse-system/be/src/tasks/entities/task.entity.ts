import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'tasks' })
export class TaskEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ default: 'To Do' })
  status: string;

  @Column({ default: 'Medium' })
  priority: string;

  @Column({ name: 'assignee_id', nullable: true })
  assignee_id?: string;

  @Column({ name: 'story_id', nullable: true })
  story_id?: string;

  @Column({ name: 'project_id', nullable: true })
  project_id?: string;

  @Column({ name: 'sprint_id', nullable: true })
  sprint_id?: string;

  @Column({ name: 'due_date', type: 'timestamp', nullable: true })
  due_date?: Date;

  @Column({ name: 'estimated_hours', type: 'decimal', precision: 5, scale: 2, nullable: true })
  estimated_hours?: number;

  @Column({ name: 'actual_hours', type: 'decimal', precision: 5, scale: 2, nullable: true })
  actual_hours?: number;

  @Column({ type: 'simple-json', nullable: true })
  tags?: string[];

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at: Date;
}

