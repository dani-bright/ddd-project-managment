import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { ProjectRepository } from '../../domain/project.repository';
import { Project } from '../../domain/projects.entity';
import { ProjectModel } from './project.model';
import { UserModel } from '../../../users/infrastructure/sequelize/users.model';
import { Op } from 'sequelize';
import { RemoveUserDto } from '../../dto/remove-user.dto';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { extractUser } from '../../../shared/sequelize/utils';
import { User } from '../../../users/domain/user.entity';
import { AddedMember } from '../../../shared/domain/groups-project.repository';
import { GroupModel } from '../../../groups/infrastructure/sequelize/groups.model';

@Injectable()
export class SequelizeProjectRepository implements ProjectRepository {
  constructor(
    @InjectModel(ProjectModel)
    private readonly projectModel: typeof ProjectModel,

    @InjectModel(UserModel)
    private readonly userModel: typeof UserModel,

    @InjectModel(GroupModel)
    private readonly groupModel: typeof GroupModel,
  ) {}

  async get(id: number): Promise<Project | null> {
    const project = await this.projectModel.findByPk(id);
    return project ? new Project(project.id, project.name, []) : null;
  }

  async removeUsers({ userId, projectId }: RemoveUserDto): Promise<void> {
    const project = await this.projectModel.findByPk(projectId, { include: [UserModel] });
    if (!project) {
      throw new NotFoundException(`Project with ID ${projectId} not found`);
    }

    const user = await this.userModel.findByPk(userId);
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    const isMember = project.dataValues.users.some(({ dataValues: { id } }) => id === userId);
    if (!isMember) {
      throw new BadRequestException(
        `User with ID ${userId} is not a member of project with ID ${projectId}`,
      );
    }

    await project.$remove('user', userId);
  }

  async listMembers(projectId: number): Promise<Project | null> {
    const project = await this.projectModel.findByPk(projectId, {
      include: [
        {
          model: UserModel,
          as: 'users',
          include: [
            {
              model: GroupModel,
              as: 'groups',
              include: [{ model: GroupModel, as: 'subGroups' }],
            },
          ],
        },
      ],
    });
    if (!project) return null;

    const usersWithFlattenedGroups = project.dataValues.users.map((user) => ({
      id: user.id,
      name: `${user.dataValues.firstName} ${user.dataValues.lastName}`, // Keep user data
      groups: [
        ...new Set(
          user.dataValues.groups.flatMap((group) => [
            group.dataValues.name,
            ...group.dataValues.subGroups.map((subGroup) => subGroup.dataValues.name),
          ]),
        ),
      ],
    }));

    return new Project(projectId, project.name, usersWithFlattenedGroups);
  }

  async addUsers(projectId: number, userIds: number[]): Promise<AddedMember[]> {
    const project = await this.projectModel.findByPk(projectId);
    if (!project) {
      throw new NotFoundException(`Project with ID ${projectId} not found`);
    }
    const users = await this.userModel.findAll({
      where: {
        id: {
          [Op.in]: userIds,
        },
      },
      include: [ProjectModel],
    });

    const isAlreadyMember = users.some((user) =>
      user.dataValues.projects.some(({ dataValues: { id } }) => id === projectId),
    );

    if (isAlreadyMember) {
      throw new BadRequestException(`One of the user is already a member of project`);
    }
    if (users.length !== userIds.length) {
      throw new BadRequestException(`batch addition failed and user couldn't be found`);
    }

    await project.$add('user', userIds);

    return extractUser(users);
  }

  async addGroups(projectId: number, groupIds: number[]): Promise<number[]> {
    const project = await this.projectModel.findByPk(projectId);
    if (!project) {
      throw new NotFoundException(`Project with ID ${projectId} not found`);
    }
    const groups = await this.groupModel.findAll({
      where: {
        id: {
          [Op.in]: groupIds,
        },
      },
      include: [ProjectModel],
    });

    if (groups.length !== groupIds.length) {
      throw new BadRequestException(`batch addition failed a group couldn't be found`);
    }

    const isAlreadyMember = groups.some((group) =>
      group.dataValues.projects.some(({ dataValues: { id } }) => id === projectId),
    );

    if (isAlreadyMember) {
      throw new BadRequestException(`One of the group is already a member of this project`);
    }

    await project.$add('group', groupIds);
    return groupIds;
  }

  getUserNestGroup() {}
}
