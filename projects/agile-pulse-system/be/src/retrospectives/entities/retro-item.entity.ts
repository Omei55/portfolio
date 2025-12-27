import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { RetroBoardEntity } from './retro-board.entity';
import { RetroCategoryEntity } from './retro-category.entity';
import { ActionItemEntity } from './action-item.entity';

@Entity({ name: 'retro_items' })
export class RetroItemEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'board_id' })
  board_id: string;

  @Column({ name: 'category_id' })
  category_id: string;

  @Column({ type: 'text' })
  content: string;

  @Column({ name: 'created_by', nullable: true })
  created_by?: string;

  @Column({ name: 'votes', type: 'int', default: 0 })
  votes: number;

  @Column({ name: 'display_order', type: 'int', default: 0 })
  display_order: number;

  @ManyToOne(() => RetroBoardEntity, (board) => board.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'board_id' })
  board: RetroBoardEntity;

  @ManyToOne(() => RetroCategoryEntity, (category) => category.items)
  @JoinColumn({ name: 'category_id' })
  category: RetroCategoryEntity;

  @OneToOne(() => ActionItemEntity, (actionItem) => actionItem.retro_item, { nullable: true })
  action_item: ActionItemEntity;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at: Date;
}

