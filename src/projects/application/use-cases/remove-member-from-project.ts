import { NotFoundException } from '@nestjs/common';
import { ProjectRepository } from '../../domain/project.repository';
import { RemoveUserDto } from '../../dto/remove-user.dto';

export class RemoveMemberFromProjectUseCase {
  constructor(private readonly projectRepository: ProjectRepository) {}

  async execute({ projectId, userId }: RemoveUserDto): Promise<RemoveUserDto> {
    const project = await this.projectRepository.get(projectId);
    if (!project) throw new NotFoundException('Project not found');
    await this.projectRepository.removeUsers({ projectId, userId });
    return { projectId, userId };
  }
}
