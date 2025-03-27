import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { GroupRepository } from '../../domain/groups.repository';
import { Group } from '../../domain/groups.entity';
import { GroupModel } from './groups.model';
import { UserModel } from '../../../users/infrastructure/sequelize/users.model';
import { Op } from 'sequelize';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { extractUser } from '../../../shared/sequelize/utils';
import { RemoveUserDto } from '../../../groups/dto/remove-user.dto';
import { AddedMember } from '../../../shared/domain/groups-project.repository';
import { GroupHierarchyModel } from './group-members.model';

@Injectable()
export class SequelizeGroupRepository implements GroupRepository {
  constructor(
    @InjectModel(GroupModel)
    private readonly groupModel: typeof GroupModel,

    @InjectModel(UserModel)
    private readonly userModel: typeof UserModel,
  ) {}

  async get(id: number): Promise<Group | null> {
    const group = await this.groupModel.findByPk(id);
    return group ? new Group(group.id, group.name, []) : null;
  }

  async removeUser({ userId, groupId }: RemoveUserDto): Promise<void> {
    const group = await this.groupModel.findByPk(groupId, { include: [UserModel] });
    if (!group) {
      throw new NotFoundException(`Group with ID ${groupId} not found`);
    }

    const user = await this.userModel.findByPk(userId);
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    const isMember = group.dataValues.users.some(({ dataValues: { id } }) => id === userId);
    if (!isMember) {
      throw new BadRequestException(
        `User with ID ${userId} is not a member of group with ID ${groupId}`,
      );
    }

    await group.$remove('user', userId);
  }

  async addUsers(groupId: number, userIds: number[]): Promise<AddedMember[]> {
    const group = await this.groupModel.findByPk(groupId);
    if (!group) {
      throw new NotFoundException(`Group with ID ${groupId} not found`);
    }
    const users = await this.userModel.findAll({
      where: {
        id: {
          [Op.in]: userIds,
        },
      },
      include: [GroupModel],
    });

    const isAlreadyMember = users.some((user) =>
      user.dataValues.groups.some(({ dataValues: { id } }) => id === groupId),
    );

    const hasReachLimit = users.some((user) => user.dataValues.groups.length === 5);

    if (hasReachLimit) {
      throw new BadRequestException(`One of the user has reach the limit of group he can join`);
    }

    if (isAlreadyMember) {
      throw new BadRequestException(`One of the user is already a member of group`);
    }
    if (users.length !== userIds.length) {
      throw new BadRequestException(`batch addition failed and user couldn't be found`);
    }

    await group.$add('user', userIds);
    return extractUser(users);
  }

  async addGroups(groupId: number, groupIds: number[]): Promise<number[]> {
    const group = await GroupModel.findByPk(groupId);
    if (!group) {
      throw new NotFoundException(`Group with ID ${groupId} not found`);
    }
    const groups = await this.groupModel.findAll({
      where: {
        id: {
          [Op.in]: groupIds,
        },
      },
      include: [{ model: GroupModel, as: 'subGroups' }],
    });

    if (groups.length !== groupIds.length) {
      throw new BadRequestException(`batch addition failed a group couldn't be found`);
    }

    const isItself = groupIds.some((id) => id === groupId);
    if (isItself) {
      throw new BadRequestException(`can't add group to itself`);
    }

    const subGroups = await this.getAllSubGroups(groupId);
    const hasReachLimit = subGroups.length >= 5;
    if (hasReachLimit) {
      throw new BadRequestException(`You cannot add other groups in the current group`);
    }

    const isAlreadyMember = groups.some((group) =>
      group.dataValues.subGroups.some(({ dataValues: { id } }) => id === groupId),
    );
    if (isAlreadyMember) {
      throw new BadRequestException(`One of the group is already a member of group`);
    }

    await group.$add('subGroups', groupIds);
    return groupIds;
  }

  async getAllSubGroups(groupId: number): Promise<number[]> {
    const allRelations = await GroupHierarchyModel.findAll();

    const parentMap = new Map<number, number[]>();
    for (const relation of allRelations) {
      if (!parentMap.has(relation.dataValues.parentGroupId)) {
        parentMap.set(relation.dataValues.parentGroupId, []);
      }
      const mapKey = parentMap.get(relation.dataValues.parentGroupId);
      if (mapKey) mapKey.push(relation.dataValues.childGroupId);
    }

    const getNestedGroups = (parentId: number): number[] => {
      if (!parentMap.has(parentId)) return [];
      const childIds = parentMap.get(parentId)!;

      let nestedGroupsIds: number[] = [...childIds];

      childIds.forEach((childId) => {
        nestedGroupsIds.push(...getNestedGroups(childId));
      });

      return nestedGroupsIds;
    };

    return getNestedGroups(groupId);
  }
}
