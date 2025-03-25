import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { ProjectRepository } from '../../domain/project.repository';
import { Project } from '../../domain/projects.entity';
import { ProjectModel } from './project.model';
import { UserModel } from 'src/users/infrastructure/sequelize/users.model';
import { Op } from 'sequelize';

@Injectable()
export class SequelizeProjectRepository implements ProjectRepository {
  constructor(
    @InjectModel(ProjectModel)
    private readonly projectModel: typeof ProjectModel,

    @InjectModel(UserModel)
    private readonly userModel: typeof UserModel,
  ) {}

  async listMembers(id: number): Promise<Project | null> {
    const found = await this.projectModel.findOne({
      where: { id },
      include: [
        {
          model: UserModel,
        },
      ],
    });
    if (!found) return null;

    const users = found.dataValues.users.map(({ dataValues: { id, firstName, lastName } }) => ({
      id,
      name: `${firstName} ${lastName}`,
    }));
    return new Project(found.id, found.name, users);
  }

  async addUser(projectId: number, userIds: number[]): Promise<void> {
    const users = await this.userModel.findAll({
      where: {
        id: {
          [Op.in]: userIds,
        },
      },
    });
    if (users.length !== userIds.length) {
      //TODO move checks in the main repository
      throw new Error(`batch addition failed and user couldn't be found`);
    }

    const project = await this.projectModel.findByPk(projectId);
    if (!project) {
      //TODO move checks in the main repository
      throw new Error(`Project with ID ${projectId} not found`);
    }

    await project.$add('user', userIds);
  }
}
