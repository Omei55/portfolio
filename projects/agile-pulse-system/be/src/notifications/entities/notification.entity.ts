import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'notifications' })
export class NotificationEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  user_id: string;

  @Column({ name: 'type' })
  type: string; // 'story_sprint_ready', 'story_exported', 'mvp_finalized', etc.

  @Column({ name: 'title', type: 'varchar', length: 255 })
  title: string;

  @Column({ name: 'message', type: 'text' })
  message: string;

  @Column({ name: 'read', type: 'boolean', default: false })
  read: boolean;

  @Column({ name: 'read_at', type: 'timestamp', nullable: true })
  read_at?: Date;

  @Column({ name: 'metadata', type: 'simple-json', nullable: true })
  metadata?: any; // Additional data like story_id, sprint_id, etc.

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at: Date;
}

