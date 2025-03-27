import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe } from '@nestjs/common';
import { AddUsersDto } from '../../shared/dto/add-users.dto';
import { AddMembersToProjectUseCase } from '../application/use-cases/add-members-to-project';
import { ListProjectMemberUseCase } from '../application/use-cases/list-project-members';
import { RemoveMemberFromProjectUseCase } from '../application/use-cases/remove-member-from-project';
import { AddGroupsDto } from '../../shared/dto/add-groups.dto';
import { AddGroupsToProjectUseCase } from '../application/use-cases/add-groups-to-project';

@Controller('projects')
export class ProjectsController {
  constructor(
    private readonly addMemberToProject: AddMembersToProjectUseCase,
    private readonly listProjectMembers: ListProjectMemberUseCase,
    private readonly removeMemberFromProject: RemoveMemberFromProjectUseCase,
    private readonly addGroupsToProject: AddGroupsToProjectUseCase,
  ) {}

  @Get(':id/members')
  async listMembers(@Param('id', ParseIntPipe) projectId: number) {
    return (await this.listProjectMembers.execute(projectId)).users;
  }

  @Post(':id/users-members')
  async addUsers(@Param('id', ParseIntPipe) projectId: number, @Body() { userIds }: AddUsersDto) {
    return this.addMemberToProject.execute(projectId, userIds);
  }

  @Post(':id/groups-members')
  async addGroups(
    @Param('id', ParseIntPipe) projectId: number,
    @Body() { groupIds }: AddGroupsDto,
  ) {
    return this.addGroupsToProject.execute(projectId, groupIds);
  }

  @Delete(':projectId/members/:userId')
  async removeMember(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Param('userId', ParseIntPipe) userId: number,
  ) {
    return this.removeMemberFromProject.execute({ projectId, userId });
  }
}
