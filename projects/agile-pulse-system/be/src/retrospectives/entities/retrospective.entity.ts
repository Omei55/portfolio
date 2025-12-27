import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'retrospectives' })
export class RetrospectiveEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'sprint_id', nullable: true })
  sprint_id?: string;

  @Column({ name: 'sprint_name', nullable: true })
  sprint_name?: string;

  @Column({ name: 'went_well', type: 'text' })
  went_well: string;

  @Column({ name: 'to_improve', type: 'text' })
  to_improve: string;

  @Column({ name: 'action_items', type: 'text' })
  action_items: string;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at: Date;
}

