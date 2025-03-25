import { NotFoundException } from '@nestjs/common';
import { ProjectRepository } from '../../domain/project.repository';
import { RemoveMemberDto } from '../../dto/remove-member.dto';

export class RemoveMemberFromProjectUseCase {
  constructor(private readonly projectRepository: ProjectRepository) {}

  async execute({ projectId, userId }: RemoveMemberDto): Promise<RemoveMemberDto> {
    const project = await this.projectRepository.get(projectId);
    if (!project) throw new NotFoundException('Project not found');
    await this.projectRepository.removeMember({ projectId, userId });
    return { projectId, userId };
  }
}
