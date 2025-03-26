import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { AddedMember, ProjectRepository } from '../../domain/project.repository';
import { Project } from '../../domain/projects.entity';
import { ProjectModel } from './project.model';
import { UserModel } from '../../../users/infrastructure/sequelize/users.model';
import { Op } from 'sequelize';
import { RemoveMemberDto } from '../../dto/remove-member.dto';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { extractUser } from '../../../users/infrastructure/sequelize/utils';
import sequelize from 'sequelize';
import { User } from 'src/users/domain/user.entity';

@Injectable()
export class SequelizeProjectRepository implements ProjectRepository {
  constructor(
    @InjectModel(ProjectModel)
    private readonly projectModel: typeof ProjectModel,

    @InjectModel(UserModel)
    private readonly userModel: typeof UserModel,
  ) {}

  async get(id: number): Promise<Project | null> {
    const project = await this.projectModel.findByPk(id);
    return project ? new Project(project.id, project.name, []) : null;
  }

  async removeMember({ userId, projectId }: RemoveMemberDto): Promise<void> {
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
    const project:
      | { id: number; firstName: string; lastName: string; projectName: string }[]
      | undefined = await this.projectModel.sequelize?.query(
      `SELECT 
      u.id AS id, 
      u.first_name AS firstName,
      u.last_name AS lastName,
      p_other.name AS projectName
  FROM projects_members pm
  JOIN users u ON pm.user_id = u.id
  JOIN projects_members pm_other ON u.id = pm_other.user_id
  JOIN projects p_other ON pm_other.project_id = p_other.id
  WHERE pm.project_id = :projectId;
`,
      { replacements: { projectId }, type: sequelize.QueryTypes.SELECT },
    );

    if (!project) return null;

    const groupedUsers = project.reduce((acc, row) => {
      const { id, firstName, lastName, projectName } = row;

      if (!acc[id]) {
        acc[id] = {
          id,
          name: `${firstName} ${lastName}`,
          projects: [],
        };
      }
      acc[id].projects.push(projectName);
      return acc;
    }, {});

    const users: User[] = Object.values(groupedUsers);

    return new Project(1, 'project.name', users);
  }

  async addMembers(projectId: number, userIds: number[]): Promise<AddedMember[]> {
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

    const project = await this.projectModel.findByPk(projectId);
    if (!project) {
      throw new NotFoundException(`Project with ID ${projectId} not found`);
    }

    await project.$add('user', userIds);

    return extractUser(users);
  }
}
