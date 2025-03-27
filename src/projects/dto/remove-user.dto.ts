import { IsInt } from 'class-validator';

export class RemoveUserDto {
  @IsInt()
  projectId: number;

  @IsInt()
  userId: number;
}
