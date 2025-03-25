import { NotFoundException } from '@nestjs/common';
import { AddedMember, ProjectRepository } from '../../domain/project.repository';

export class AddMembersToProjectUseCase {
  constructor(private readonly projectRepository: ProjectRepository) {}

  async execute(projectId: number, userIds: number[]): Promise<AddedMember[]> {
    const project = await this.projectRepository.get(projectId);
    if (!project) throw new NotFoundException('Project not found');
    return this.projectRepository.addMembers(projectId, userIds);
  }
}
