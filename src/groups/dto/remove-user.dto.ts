import { IsInt } from 'class-validator';

export class RemoveUserDto {
  @IsInt()
  groupId: number;

  @IsInt()
  userId: number;
}
