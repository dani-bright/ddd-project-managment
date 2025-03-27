import { NotFoundException } from '@nestjs/common';
import { GroupRepository } from '../../domain/groups.repository';
import { AddedMember } from '../../../shared/domain/groups-project.repository';

export class AddUsersToGroupUseCase {
  constructor(private readonly groupRepository: GroupRepository) {}

  async execute(projectId: number, userIds: number[]): Promise<AddedMember[]> {
    const project = await this.groupRepository.get(projectId);
    if (!project) throw new NotFoundException('Group not found');
    return this.groupRepository.addUsers(projectId, userIds);
  }
}
