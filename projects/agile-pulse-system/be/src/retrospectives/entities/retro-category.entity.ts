import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { RetroItemEntity } from './retro-item.entity';

@Entity({ name: 'retro_categories' })
export class RetroCategoryEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ name: 'display_order', type: 'int', default: 0 })
  display_order: number;

  @Column({ default: true })
  is_active: boolean;

  @OneToMany(() => RetroItemEntity, (item) => item.category)
  items: RetroItemEntity[];

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at: Date;
}

