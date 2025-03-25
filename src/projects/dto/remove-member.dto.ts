import { IsInt } from 'class-validator';

export class RemoveMemberDto {
  @IsInt()
  projectId: number;

  @IsInt()
  userId: number;
}
