import { IsUUID } from 'class-validator';

export class AddMemberDto {
  @IsUUID()
  user_id: string;
}


