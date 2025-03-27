import { NotFoundException } from '@nestjs/common';
import { GroupRepository } from '../../domain/groups.repository';

export class AddGroupsToGroupUseCase {
  constructor(private readonly groupRepository: GroupRepository) {}

  async execute(groupId: number, groupIds: number[]): Promise<number[]> {
    const project = await this.groupRepository.get(groupId);
    if (!project) throw new NotFoundException('Group not found');
    return this.groupRepository.addGroups(groupId, groupIds);
  }
}
