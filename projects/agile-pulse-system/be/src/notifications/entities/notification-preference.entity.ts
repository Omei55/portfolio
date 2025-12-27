import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'notification_preferences' })
export class NotificationPreferenceEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', unique: true })
  user_id: string;

  @Column({ name: 'story_sprint_ready', type: 'boolean', default: true })
  story_sprint_ready: boolean;

  @Column({ name: 'story_exported', type: 'boolean', default: true })
  story_exported: boolean;

  @Column({ name: 'mvp_finalized', type: 'boolean', default: true })
  mvp_finalized: boolean;

  @Column({ name: 'story_status_changed', type: 'boolean', default: true })
  story_status_changed: boolean;

  @Column({ name: 'email_notifications', type: 'boolean', default: false })
  email_notifications: boolean;

  @Column({ name: 'push_notifications', type: 'boolean', default: true })
  push_notifications: boolean;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at: Date;
}

