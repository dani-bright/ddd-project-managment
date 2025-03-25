import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe } from '@nestjs/common';
import { AddMembersDto } from '../dto/add-members.dto';
import { AddMembersToProjectUseCase } from '../application/use-cases/add-members-to-project';
import { ListProjectMemberUseCase } from '../application/use-cases/list-project-members';
import { RemoveMemberFromProjectUseCase } from '../application/use-cases/remove-member-from-project';

@Controller('projects')
export class ProjectsController {
  constructor(
    private readonly addMemberToProject: AddMembersToProjectUseCase,
    private readonly listProjectMembers: ListProjectMemberUseCase,
    private readonly removeMemberFromProject: RemoveMemberFromProjectUseCase,
  ) {}

  @Get(':id/members')
  async listMembers(@Param('id', ParseIntPipe) projectId: number) {
    return (await this.listProjectMembers.execute(projectId)).users;
  }

  @Post(':id/members')
  async addMembers(
    @Param('id', ParseIntPipe) projectId: number,
    @Body() { userIds }: AddMembersDto,
  ) {
    return this.addMemberToProject.execute(projectId, userIds);
  }

  @Delete(':projectId/members/:userId')
  async removeMember(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Param('userId', ParseIntPipe) userId: number,
  ) {
    return this.removeMemberFromProject.execute({ projectId, userId });
  }
}
