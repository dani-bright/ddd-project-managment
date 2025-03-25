import { NotFoundException } from '@nestjs/common';
import { ProjectRepository } from '../../domain/project.repository';
import { Project } from '../../domain/projects.entity';

export class ListProjectMemberUseCase {
  constructor(private readonly projectRepository: ProjectRepository) {}

  async execute(projectId: number): Promise<Project> {
    const project = await this.projectRepository.listMembers(projectId);
    if (!project) throw new NotFoundException('Project not found');
    return project;
  }
}
