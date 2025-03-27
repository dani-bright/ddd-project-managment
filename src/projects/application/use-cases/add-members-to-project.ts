import { NotFoundException } from '@nestjs/common';
import { ProjectRepository } from '../../domain/project.repository';
import { AddedMember } from '../../../shared/domain/groups-project.repository';

export class AddMembersToProjectUseCase {
  constructor(private readonly projectRepository: ProjectRepository) {}

  async execute(projectId: number, userIds: number[]): Promise<AddedMember[]> {
    const project = await this.projectRepository.get(projectId);
    if (!project) throw new NotFoundException('Project not found');
    return this.projectRepository.addUsers(projectId, userIds);
  }
}
