import { NotFoundException } from '@nestjs/common';
import { ProjectRepository } from '../../domain/project.repository';

export class AddGroupsToProjectUseCase {
  constructor(private readonly projectRepository: ProjectRepository) {}

  async execute(projectId: number, groupIds: number[]): Promise<number[]> {
    const project = await this.projectRepository.get(projectId);
    if (!project) throw new NotFoundException('Group not found');
    return this.projectRepository.addGroups(projectId, groupIds);
  }
}
