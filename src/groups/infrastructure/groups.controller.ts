import { Controller, Post, Body, Param, Delete, ParseIntPipe } from '@nestjs/common';
import { AddUsersToGroupUseCase } from '../application/use-cases/add-users-to-group';
import { RemoveUserFromGroupUseCase } from '../application/use-cases/remove-users-from-group';
import { AddUsersDto } from '../../shared/dto/add-users.dto';
import { AddGroupsDto } from '../../shared/dto/add-groups.dto';
import { AddGroupsToGroupUseCase } from '../application/use-cases/add-groups-to-group';

@Controller('groups')
export class GroupsController {
  constructor(
    private readonly addUsersToGroup: AddUsersToGroupUseCase,
    private readonly removeMemberFromGroup: RemoveUserFromGroupUseCase,
    private readonly addGroupsToGroup: AddGroupsToGroupUseCase,
  ) {}

  @Post(':id/users-members')
  async addUsers(@Param('id', ParseIntPipe) groupId: number, @Body() { userIds }: AddUsersDto) {
    return this.addUsersToGroup.execute(groupId, userIds);
  }

  @Post(':id/groups-members')
  async addGroups(@Param('id', ParseIntPipe) groupId: number, @Body() { groupIds }: AddGroupsDto) {
    return this.addGroupsToGroup.execute(groupId, groupIds);
  }

  @Delete(':groupId/members/:userId')
  async removeMember(
    @Param('groupId', ParseIntPipe) groupId: number,
    @Param('userId', ParseIntPipe) userId: number,
  ) {
    return this.removeMemberFromGroup.execute({ groupId, userId });
  }
}
