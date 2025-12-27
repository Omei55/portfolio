import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'stories' })
export class StoryEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ name: 'acceptance_criteria', type: 'text' })
  acceptance_criteria: string;

  @Column({ default: 'Medium' })
  priority: string;

  @Column({ name: 'story_points', type: 'int', nullable: true })
  story_points?: number;

  @Column({ nullable: true })
  assignee?: string;

  @Column({ default: 'To Do' })
  status: string;

  @Column({ nullable: true })
  sprint?: string;

  @Column({ nullable: true })
  epic?: string;

  @Column({ type: 'simple-json', nullable: true })
  tags?: string[];

  @Column({ type: 'int', nullable: true })
  value?: number;

  @Column({ type: 'int', nullable: true })
  effort?: number;

  @Column({ name: 'has_tests', type: 'boolean', default: false })
  has_tests: boolean;

  @Column({ name: 'has_blockers', type: 'boolean', default: false })
  has_blockers: boolean;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at: Date;
}
