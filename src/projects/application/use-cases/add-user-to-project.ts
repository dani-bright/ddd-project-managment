import { NotFoundException } from '@nestjs/common';
import { ProjectRepository } from '../../domain/project.repository';

export class AddUserToProjectUseCase {
  constructor(private readonly projectRepository: ProjectRepository) {}

  async execute(projectId: number, userIds: number[]): Promise<void> {
    const project = await this.projectRepository.listMembers(projectId);
    if (!project) throw new NotFoundException('Project not found');
    await this.projectRepository.addUser(projectId, userIds);
  }
}
