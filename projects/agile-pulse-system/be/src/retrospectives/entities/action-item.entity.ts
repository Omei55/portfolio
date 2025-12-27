import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { RetroItemEntity } from './retro-item.entity';

@Entity({ name: 'action_items' })
export class ActionItemEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'retro_item_id', unique: true })
  retro_item_id: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ name: 'story_id', nullable: true })
  story_id?: string;

  @Column({ name: 'assigned_to', nullable: true })
  assigned_to?: string;

  @Column({ default: 'pending' })
  status: string; // pending, in_progress, completed, cancelled

  @Column({ name: 'due_date', type: 'date', nullable: true })
  due_date?: Date;

  @Column({ name: 'priority', default: 'Medium' })
  priority: string; // Low, Medium, High, Critical

  @OneToOne(() => RetroItemEntity, (retroItem) => retroItem.action_item)
  @JoinColumn({ name: 'retro_item_id' })
  retro_item: RetroItemEntity;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at: Date;
}

