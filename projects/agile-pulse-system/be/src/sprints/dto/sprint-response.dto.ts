export class SprintResponseDto {
  id: string;
  name: string;
  description?: string;
  start_date?: Date;
  end_date?: Date;
  goal?: string;
  created_at: Date;
  updated_at: Date;
  story_count?: number;
  total_points?: number;
  stories?: any[];
}



