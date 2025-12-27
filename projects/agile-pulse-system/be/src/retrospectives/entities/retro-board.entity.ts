import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { RetroItemEntity } from './retro-item.entity';

@Entity({ name: 'retro_boards' })
export class RetroBoardEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ name: 'sprint_id', nullable: true })
  sprint_id?: string;

  @Column({ name: 'project_id', nullable: true })
  project_id?: string;

  @Column({ name: 'created_by', nullable: true })
  created_by?: string;

  @Column({ name: 'retro_date', type: 'date', nullable: true })
  retro_date?: Date;

  @Column({ default: 'active' })
  status: string; // active, completed, archived

  @OneToMany(() => RetroItemEntity, (item) => item.board, { cascade: true })
  items: RetroItemEntity[];

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at: Date;
}

