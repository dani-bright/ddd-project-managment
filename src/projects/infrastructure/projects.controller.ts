import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { UpdateProjectDto } from '../dto/update-project.dto';
import { AddUserToProjectUseCase } from '../application/use-cases/add-user-to-project';
import { ListProjectMemberUseCase } from '../application/use-cases/list-project-members';

@Controller('projects')
export class ProjectsController {
  constructor(
    private readonly addUserToProject: AddUserToProjectUseCase,
    private readonly listProjectMembers: ListProjectMemberUseCase,
  ) {}

  @Get(':id/members')
  async listMembers(@Param('id') projectId: number) {
    return (await this.listProjectMembers.execute(projectId)).users;
  }

  @Post(':id/members')
  async addUser(@Param('id') projectId: number, @Body() { userIds }: UpdateProjectDto) {
    return this.addUserToProject.execute(projectId, userIds);
  }
}
