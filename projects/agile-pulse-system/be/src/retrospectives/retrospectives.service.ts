import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RetroBoardEntity } from './entities/retro-board.entity';
import { RetroCategoryEntity } from './entities/retro-category.entity';
import { RetroItemEntity } from './entities/retro-item.entity';
import { ActionItemEntity } from './entities/action-item.entity';
import { CreateRetroBoardDto } from './dto/create-retro-board.dto';
import { UpdateRetroBoardDto } from './dto/update-retro-board.dto';
import { CreateRetroCategoryDto } from './dto/create-retro-category.dto';
import { UpdateRetroCategoryDto } from './dto/update-retro-category.dto';
import { CreateRetroItemDto } from './dto/create-retro-item.dto';
import { UpdateRetroItemDto } from './dto/update-retro-item.dto';
import { CreateActionItemDto } from './dto/create-action-item.dto';
import { UpdateActionItemDto } from './dto/update-action-item.dto';
import {
  RetroBoardResponseDto,
  RetroCategoryResponseDto,
  RetroItemResponseDto,
  ActionItemResponseDto,
} from './dto/retro-board-response.dto';

@Injectable()
export class RetrospectivesService {
  constructor(
    @InjectRepository(RetroBoardEntity)
    private readonly retroBoardRepository: Repository<RetroBoardEntity>,
    @InjectRepository(RetroCategoryEntity)
    private readonly retroCategoryRepository: Repository<RetroCategoryEntity>,
    @InjectRepository(RetroItemEntity)
    private readonly retroItemRepository: Repository<RetroItemEntity>,
    @InjectRepository(ActionItemEntity)
    private readonly actionItemRepository: Repository<ActionItemEntity>,
  ) {}

  // Retro Board Methods
  async createBoard(createDto: CreateRetroBoardDto): Promise<RetroBoardResponseDto> {
    const board = this.retroBoardRepository.create({
      title: createDto.title,
      description: createDto.description,
      sprint_id: createDto.sprintId,
      project_id: createDto.projectId,
      retro_date: createDto.retroDate ? new Date(createDto.retroDate) : null,
      status: createDto.status || 'active',
    });

    const savedBoard = await this.retroBoardRepository.save(board);
    return this.toBoardResponseDto(savedBoard);
  }

  async findAllBoards(
    sprintId?: string,
    projectId?: string,
  ): Promise<RetroBoardResponseDto[]> {
    const where: any = {};
    if (sprintId) where.sprint_id = sprintId;
    if (projectId) where.project_id = projectId;

    const boards = await this.retroBoardRepository.find({
      where,
      relations: ['items', 'items.category', 'items.action_item'],
      order: { created_at: 'DESC' },
    });

    return boards.map((board) => this.toBoardResponseDto(board));
  }

  async findBoardById(id: string): Promise<RetroBoardResponseDto> {
    const board = await this.retroBoardRepository.findOne({
      where: { id },
      relations: ['items', 'items.category', 'items.action_item'],
    });

    if (!board) {
      throw new NotFoundException(`Retrospective board with ID ${id} not found`);
    }

    return this.toBoardResponseDto(board);
  }

  async updateBoard(
    id: string,
    updateDto: UpdateRetroBoardDto,
  ): Promise<RetroBoardResponseDto> {
    const board = await this.retroBoardRepository.findOne({ where: { id } });

    if (!board) {
      throw new NotFoundException(`Retrospective board with ID ${id} not found`);
    }

    Object.assign(board, {
      title: updateDto.title ?? board.title,
      description: updateDto.description ?? board.description,
      sprint_id: updateDto.sprintId ?? board.sprint_id,
      project_id: updateDto.projectId ?? board.project_id,
      retro_date: updateDto.retroDate
        ? new Date(updateDto.retroDate)
        : board.retro_date,
      status: updateDto.status ?? board.status,
    });

    const savedBoard = await this.retroBoardRepository.save(board);
    return this.toBoardResponseDto(savedBoard);
  }

  async removeBoard(id: string): Promise<void> {
    const result = await this.retroBoardRepository.delete(id);
    if (!result.affected) {
      throw new NotFoundException(`Retrospective board with ID ${id} not found`);
    }
  }

  // Retro Category Methods
  async createCategory(
    createDto: CreateRetroCategoryDto,
  ): Promise<RetroCategoryResponseDto> {
    const category = this.retroCategoryRepository.create({
      name: createDto.name,
      description: createDto.description,
      display_order: createDto.displayOrder ?? 0,
      is_active: createDto.isActive ?? true,
    });

    const savedCategory = await this.retroCategoryRepository.save(category);
    return this.toCategoryResponseDto(savedCategory);
  }

  async findAllCategories(): Promise<RetroCategoryResponseDto[]> {
    const categories = await this.retroCategoryRepository.find({
      where: { is_active: true },
      order: { display_order: 'ASC', created_at: 'ASC' },
    });

    return categories.map((category) => this.toCategoryResponseDto(category));
  }

  async findCategoryById(id: string): Promise<RetroCategoryResponseDto> {
    const category = await this.retroCategoryRepository.findOne({
      where: { id },
    });

    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }

    return this.toCategoryResponseDto(category);
  }

  async updateCategory(
    id: string,
    updateDto: UpdateRetroCategoryDto,
  ): Promise<RetroCategoryResponseDto> {
    const category = await this.retroCategoryRepository.findOne({
      where: { id },
    });

    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }

    Object.assign(category, {
      name: updateDto.name ?? category.name,
      description: updateDto.description ?? category.description,
      display_order: updateDto.displayOrder ?? category.display_order,
      is_active: updateDto.isActive ?? category.is_active,
    });

    const savedCategory = await this.retroCategoryRepository.save(category);
    return this.toCategoryResponseDto(savedCategory);
  }

  async removeCategory(id: string): Promise<void> {
    const result = await this.retroCategoryRepository.delete(id);
    if (!result.affected) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }
  }

  // Retro Item Methods
  async createItem(createDto: CreateRetroItemDto): Promise<RetroItemResponseDto> {
    // Verify board exists
    const board = await this.retroBoardRepository.findOne({
      where: { id: createDto.boardId },
    });
    if (!board) {
      throw new NotFoundException(
        `Retrospective board with ID ${createDto.boardId} not found`,
      );
    }

    // Verify category exists
    const category = await this.retroCategoryRepository.findOne({
      where: { id: createDto.categoryId },
    });
    if (!category) {
      throw new NotFoundException(
        `Category with ID ${createDto.categoryId} not found`,
      );
    }

    const item = this.retroItemRepository.create({
      board_id: createDto.boardId,
      category_id: createDto.categoryId,
      content: createDto.content,
      display_order: createDto.displayOrder ?? 0,
      votes: 0,
    });

    const savedItem = await this.retroItemRepository.save(item);
    return this.toItemResponseDto(savedItem);
  }

  async findItemsByBoard(boardId: string): Promise<RetroItemResponseDto[]> {
    const items = await this.retroItemRepository.find({
      where: { board_id: boardId },
      relations: ['category', 'action_item'],
      order: { display_order: 'ASC', created_at: 'ASC' },
    });

    return items.map((item) => this.toItemResponseDto(item));
  }

  async findItemById(id: string): Promise<RetroItemResponseDto> {
    const item = await this.retroItemRepository.findOne({
      where: { id },
      relations: ['category', 'action_item'],
    });

    if (!item) {
      throw new NotFoundException(`Retro item with ID ${id} not found`);
    }

    return this.toItemResponseDto(item);
  }

  async updateItem(
    id: string,
    updateDto: UpdateRetroItemDto,
  ): Promise<RetroItemResponseDto> {
    const item = await this.retroItemRepository.findOne({ where: { id } });

    if (!item) {
      throw new NotFoundException(`Retro item with ID ${id} not found`);
    }

    if (updateDto.categoryId) {
      const category = await this.retroCategoryRepository.findOne({
        where: { id: updateDto.categoryId },
      });
      if (!category) {
        throw new NotFoundException(
          `Category with ID ${updateDto.categoryId} not found`,
        );
      }
    }

    Object.assign(item, {
      category_id: updateDto.categoryId ?? item.category_id,
      content: updateDto.content ?? item.content,
      votes: updateDto.votes ?? item.votes,
      display_order: updateDto.displayOrder ?? item.display_order,
    });

    const savedItem = await this.retroItemRepository.save(item);
    return this.toItemResponseDto(savedItem);
  }

  async removeItem(id: string): Promise<void> {
    const result = await this.retroItemRepository.delete(id);
    if (!result.affected) {
      throw new NotFoundException(`Retro item with ID ${id} not found`);
    }
  }

  async voteItem(id: string, increment: boolean = true): Promise<RetroItemResponseDto> {
    const item = await this.retroItemRepository.findOne({ where: { id } });

    if (!item) {
      throw new NotFoundException(`Retro item with ID ${id} not found`);
    }

    item.votes = increment ? item.votes + 1 : Math.max(0, item.votes - 1);
    const savedItem = await this.retroItemRepository.save(item);
    return this.toItemResponseDto(savedItem);
  }

  // Action Item Methods
  async createActionItem(
    createDto: CreateActionItemDto,
  ): Promise<ActionItemResponseDto> {
    // Verify retro item exists
    const retroItem = await this.retroItemRepository.findOne({
      where: { id: createDto.retroItemId },
    });
    if (!retroItem) {
      throw new NotFoundException(
        `Retro item with ID ${createDto.retroItemId} not found`,
      );
    }

    // Check if action item already exists for this retro item
    const existing = await this.actionItemRepository.findOne({
      where: { retro_item_id: createDto.retroItemId },
    });
    if (existing) {
      throw new BadRequestException(
        `Action item already exists for retro item ${createDto.retroItemId}`,
      );
    }

    const actionItem = this.actionItemRepository.create({
      retro_item_id: createDto.retroItemId,
      description: createDto.description,
      story_id: createDto.storyId,
      assigned_to: createDto.assignedTo,
      status: createDto.status || 'pending',
      due_date: createDto.dueDate ? new Date(createDto.dueDate) : null,
      priority: createDto.priority || 'Medium',
    });

    const savedActionItem = await this.actionItemRepository.save(actionItem);
    return this.toActionItemResponseDto(savedActionItem);
  }

  async findActionItemById(id: string): Promise<ActionItemResponseDto> {
    const actionItem = await this.actionItemRepository.findOne({
      where: { id },
      relations: ['retro_item'],
    });

    if (!actionItem) {
      throw new NotFoundException(`Action item with ID ${id} not found`);
    }

    return this.toActionItemResponseDto(actionItem);
  }

  async findActionItemsByStory(
    storyId: string,
  ): Promise<ActionItemResponseDto[]> {
    const actionItems = await this.actionItemRepository.find({
      where: { story_id: storyId },
      relations: ['retro_item'],
      order: { created_at: 'DESC' },
    });

    return actionItems.map((item) => this.toActionItemResponseDto(item));
  }

  async updateActionItem(
    id: string,
    updateDto: UpdateActionItemDto,
  ): Promise<ActionItemResponseDto> {
    const actionItem = await this.actionItemRepository.findOne({ where: { id } });

    if (!actionItem) {
      throw new NotFoundException(`Action item with ID ${id} not found`);
    }

    Object.assign(actionItem, {
      description: updateDto.description ?? actionItem.description,
      story_id: updateDto.storyId ?? actionItem.story_id,
      assigned_to: updateDto.assignedTo ?? actionItem.assigned_to,
      status: updateDto.status ?? actionItem.status,
      due_date: updateDto.dueDate
        ? new Date(updateDto.dueDate)
        : actionItem.due_date,
      priority: updateDto.priority ?? actionItem.priority,
    });

    const savedActionItem = await this.actionItemRepository.save(actionItem);
    return this.toActionItemResponseDto(savedActionItem);
  }

  async linkActionItemToStory(
    actionItemId: string,
    storyId: string,
  ): Promise<ActionItemResponseDto> {
    const actionItem = await this.actionItemRepository.findOne({
      where: { id: actionItemId },
    });

    if (!actionItem) {
      throw new NotFoundException(`Action item with ID ${actionItemId} not found`);
    }

    actionItem.story_id = storyId;
    const savedActionItem = await this.actionItemRepository.save(actionItem);
    return this.toActionItemResponseDto(savedActionItem);
  }

  async unlinkActionItemFromStory(
    actionItemId: string,
  ): Promise<ActionItemResponseDto> {
    const actionItem = await this.actionItemRepository.findOne({
      where: { id: actionItemId },
    });

    if (!actionItem) {
      throw new NotFoundException(`Action item with ID ${actionItemId} not found`);
    }

    actionItem.story_id = null;
    const savedActionItem = await this.actionItemRepository.save(actionItem);
    return this.toActionItemResponseDto(savedActionItem);
  }

  async removeActionItem(id: string): Promise<void> {
    const result = await this.actionItemRepository.delete(id);
    if (!result.affected) {
      throw new NotFoundException(`Action item with ID ${id} not found`);
    }
  }

  // Response DTO Mappers
  private toBoardResponseDto(board: RetroBoardEntity): RetroBoardResponseDto {
    return {
      id: board.id,
      title: board.title,
      description: board.description,
      sprintId: board.sprint_id,
      projectId: board.project_id,
      createdBy: board.created_by,
      retroDate: board.retro_date,
      status: board.status,
      items: board.items
        ? board.items.map((item) => this.toItemResponseDto(item))
        : undefined,
      createdAt: board.created_at,
      updatedAt: board.updated_at,
    };
  }

  private toCategoryResponseDto(
    category: RetroCategoryEntity,
  ): RetroCategoryResponseDto {
    return {
      id: category.id,
      name: category.name,
      description: category.description,
      displayOrder: category.display_order,
      isActive: category.is_active,
      createdAt: category.created_at,
      updatedAt: category.updated_at,
    };
  }

  private toItemResponseDto(item: RetroItemEntity): RetroItemResponseDto {
    return {
      id: item.id,
      boardId: item.board_id,
      categoryId: item.category_id,
      content: item.content,
      createdBy: item.created_by,
      votes: item.votes,
      displayOrder: item.display_order,
      category: item.category
        ? this.toCategoryResponseDto(item.category)
        : undefined,
      actionItem: item.action_item
        ? this.toActionItemResponseDto(item.action_item)
        : undefined,
      createdAt: item.created_at,
      updatedAt: item.updated_at,
    };
  }

  private toActionItemResponseDto(
    actionItem: ActionItemEntity,
  ): ActionItemResponseDto {
    return {
      id: actionItem.id,
      retroItemId: actionItem.retro_item_id,
      description: actionItem.description,
      storyId: actionItem.story_id,
      assignedTo: actionItem.assigned_to,
      status: actionItem.status,
      dueDate: actionItem.due_date,
      priority: actionItem.priority,
      createdAt: actionItem.created_at,
      updatedAt: actionItem.updated_at,
    };
  }
}

