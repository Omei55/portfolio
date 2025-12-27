import { Injectable } from '@nestjs/common';
import {
  DataSource,
  DeepPartial,
  EntityTarget,
  FindManyOptions,
  FindOneOptions,
} from 'typeorm';

@Injectable()
export class DatabaseService {
  constructor(private readonly data_source: DataSource) {}

  private get_repository<Entity>(entity: EntityTarget<Entity>) {
    return this.data_source.getRepository(entity);
  }

  async create_one<Entity>(
    entity: EntityTarget<Entity>,
    data: DeepPartial<Entity>,
  ): Promise<Entity> {
    const repository = this.get_repository(entity);
    const record = repository.create(data);
    return repository.save(record);
  }

  async find<Entity>(
    entity: EntityTarget<Entity>,
    options?: FindManyOptions<Entity>,
  ): Promise<Entity[]> {
    const repository = this.get_repository(entity);
    return repository.find(options);
  }

  async find_one<Entity>(
    entity: EntityTarget<Entity>,
    options: FindOneOptions<Entity>,
  ): Promise<Entity | null> {
    const repository = this.get_repository(entity);
    return repository.findOne(options);
  }

  async update_one<Entity>(
    entity: EntityTarget<Entity>,
    criteria: FindOneOptions<Entity>,
    data: DeepPartial<Entity>,
  ): Promise<Entity | null> {
    const repository = this.get_repository(entity);
    const existing = await repository.findOne(criteria);
    if (!existing) {
      return null;
    }
    const merged = repository.merge(existing, data);
    return repository.save(merged);
  }

  async delete_one<Entity>(
    entity: EntityTarget<Entity>,
    criteria: FindOneOptions<Entity>,
  ): Promise<void> {
    const repository = this.get_repository(entity);
    const record = await repository.findOne(criteria);
    if (!record) {
      return;
    }
    await repository.remove(record);
  }
}
