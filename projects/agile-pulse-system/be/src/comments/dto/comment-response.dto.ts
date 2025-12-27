export class CommentResponseDto {
  id: string;
  content: string;
  storyId?: string | null;
  taskId?: string | null;
  userId: string;
  authorName?: string;
  authorEmail?: string;
  createdAt: Date;
  updatedAt: Date;
}



