import { NotFoundException } from '@nestjs/common';
import { GroupRepository } from '../../domain/groups.repository';
import { RemoveUserDto } from '../../dto/remove-user.dto';

export class RemoveUserFromGroupUseCase {
  constructor(private readonly groupRepository: GroupRepository) {}

  async execute({ groupId, userId }: RemoveUserDto): Promise<RemoveUserDto> {
    const project = await this.groupRepository.get(groupId);
    if (!project) throw new NotFoundException('Group not found');
    await this.groupRepository.removeUser({ groupId, userId });
    return { groupId, userId };
  }
}
