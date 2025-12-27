import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
  Query,
} from '@nestjs/common';
import { RetrospectivesService } from './retrospectives.service';
import { CreateRetroBoardDto } from './dto/create-retro-board.dto';
import { UpdateRetroBoardDto } from './dto/update-retro-board.dto';
import { CreateRetroCategoryDto } from './dto/create-retro-category.dto';
import { UpdateRetroCategoryDto } from './dto/update-retro-category.dto';
import { CreateRetroItemDto } from './dto/create-retro-item.dto';
import { UpdateRetroItemDto } from './dto/update-retro-item.dto';
import { CreateActionItemDto } from './dto/create-action-item.dto';
import { UpdateActionItemDto } from './dto/update-action-item.dto';
import { LinkActionItemToStoryDto } from './dto/link-action-item-to-story.dto';

@Controller('api/retrospectives')
export class RetrospectivesController {
  constructor(
    private readonly retrospectivesService: RetrospectivesService,
  ) {}

  // Retro Board Endpoints
  @Post('boards')
  @HttpCode(HttpStatus.CREATED)
  createBoard(@Body() createDto: CreateRetroBoardDto) {
    return this.retrospectivesService.createBoard(createDto);
  }

  @Get('boards')
  findAllBoards(
    @Query('sprintId') sprintId?: string,
    @Query('projectId') projectId?: string,
  ) {
    return this.retrospectivesService.findAllBoards(sprintId, projectId);
  }

  @Get('boards/:id')
  findBoardById(@Param('id') id: string) {
    return this.retrospectivesService.findBoardById(id);
  }

  @Patch('boards/:id')
  updateBoard(
    @Param('id') id: string,
    @Body() updateDto: UpdateRetroBoardDto,
  ) {
    return this.retrospectivesService.updateBoard(id, updateDto);
  }

  @Delete('boards/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  removeBoard(@Param('id') id: string) {
    return this.retrospectivesService.removeBoard(id);
  }

  // Retro Category Endpoints
  @Post('categories')
  @HttpCode(HttpStatus.CREATED)
  createCategory(@Body() createDto: CreateRetroCategoryDto) {
    return this.retrospectivesService.createCategory(createDto);
  }

  @Get('categories')
  findAllCategories() {
    return this.retrospectivesService.findAllCategories();
  }

  @Get('categories/:id')
  findCategoryById(@Param('id') id: string) {
    return this.retrospectivesService.findCategoryById(id);
  }

  @Patch('categories/:id')
  updateCategory(
    @Param('id') id: string,
    @Body() updateDto: UpdateRetroCategoryDto,
  ) {
    return this.retrospectivesService.updateCategory(id, updateDto);
  }

  @Delete('categories/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  removeCategory(@Param('id') id: string) {
    return this.retrospectivesService.removeCategory(id);
  }

  // Retro Item Endpoints
  @Post('items')
  @HttpCode(HttpStatus.CREATED)
  createItem(@Body() createDto: CreateRetroItemDto) {
    return this.retrospectivesService.createItem(createDto);
  }

  @Get('boards/:boardId/items')
  findItemsByBoard(@Param('boardId') boardId: string) {
    return this.retrospectivesService.findItemsByBoard(boardId);
  }

  @Get('items/:id')
  findItemById(@Param('id') id: string) {
    return this.retrospectivesService.findItemById(id);
  }

  @Patch('items/:id')
  updateItem(
    @Param('id') id: string,
    @Body() updateDto: UpdateRetroItemDto,
  ) {
    return this.retrospectivesService.updateItem(id, updateDto);
  }

  @Post('items/:id/vote')
  @HttpCode(HttpStatus.OK)
  voteItem(
    @Param('id') id: string,
    @Body('increment') increment?: boolean,
  ) {
    return this.retrospectivesService.voteItem(id, increment ?? true);
  }

  @Delete('items/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  removeItem(@Param('id') id: string) {
    return this.retrospectivesService.removeItem(id);
  }

  // Action Item Endpoints
  @Post('action-items')
  @HttpCode(HttpStatus.CREATED)
  createActionItem(@Body() createDto: CreateActionItemDto) {
    return this.retrospectivesService.createActionItem(createDto);
  }

  @Get('action-items/:id')
  findActionItemById(@Param('id') id: string) {
    return this.retrospectivesService.findActionItemById(id);
  }

  @Get('action-items/story/:storyId')
  findActionItemsByStory(@Param('storyId') storyId: string) {
    return this.retrospectivesService.findActionItemsByStory(storyId);
  }

  @Patch('action-items/:id')
  updateActionItem(
    @Param('id') id: string,
    @Body() updateDto: UpdateActionItemDto,
  ) {
    return this.retrospectivesService.updateActionItem(id, updateDto);
  }

  @Post('action-items/:id/link-story')
  @HttpCode(HttpStatus.OK)
  linkActionItemToStory(
    @Param('id') id: string,
    @Body() linkDto: LinkActionItemToStoryDto,
  ) {
    return this.retrospectivesService.linkActionItemToStory(id, linkDto.storyId);
  }

  @Post('action-items/:id/unlink-story')
  @HttpCode(HttpStatus.OK)
  unlinkActionItemFromStory(@Param('id') id: string) {
    return this.retrospectivesService.unlinkActionItemFromStory(id);
  }

  @Delete('action-items/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  removeActionItem(@Param('id') id: string) {
    return this.retrospectivesService.removeActionItem(id);
  }
}

