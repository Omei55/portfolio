export class RetrospectiveResponseDto {
  id: string;
  sprintId?: string;
  sprintName?: string;
  wentWell: string;
  toImprove: string;
  actionItems: string;
  createdAt: Date;
  updatedAt: Date;
}

