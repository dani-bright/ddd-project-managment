import { Test, TestingModule } from '@nestjs/testing';
import { ProjectsController } from './projects.controller';
import { ProjectModel } from './sequelize/project.model';
import { SequelizeModule } from '@nestjs/sequelize';
import { ProjectGroupsModel, ProjectsMembersModel } from './sequelize/projects-members.model';
import { INestApplication } from '@nestjs/common';
import { Sequelize } from 'sequelize-typescript';
import { ProjectsModule } from '../projects.module';
import { UserModel } from '../../users/infrastructure/sequelize/users.model';
import * as request from 'supertest';
import {
  GroupHierarchyModel,
  GroupsMembersModel,
} from '../../groups/infrastructure/sequelize/group-members.model';
import { GroupModel } from '../../groups/infrastructure/sequelize/groups.model';
import {
  group1,
  group2,
  group3,
  group4,
  group5,
  group6,
  group7,
  group8,
  project1,
  project2,
  project3,
  project4,
  project5,
  project6,
  user1,
  user2,
  user3,
  user4,
  user5,
  user6,
  user7,
} from '../../tests/mocks';
import { GroupsModule } from '../../groups/groups.module';

describe('ProjectsController (E2E)', () => {
  let app: INestApplication;
  let controller: ProjectsController;
  let db: Sequelize;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        SequelizeModule.forRoot({
          dialect: 'sqlite',
          storage: ':memory:',
          models: [
            ProjectModel,
            UserModel,
            ProjectsMembersModel,
            GroupModel,
            GroupsMembersModel,
            GroupHierarchyModel,
            ProjectGroupsModel,
          ],
          autoLoadModels: true,
          synchronize: true,
          logging: false,
        }),
        ProjectsModule,
        GroupsModule,
      ],
      controllers: [ProjectsController],
    }).compile();

    app = module.createNestApplication();
    await app.init();

    controller = module.get<ProjectsController>(ProjectsController);
    db = module.get<Sequelize>(Sequelize);
    await db.sync({ force: true });
  });

  afterEach(async () => {
    await ProjectsMembersModel.destroy({ where: {} });
    await GroupModel.destroy({ where: {} });
    await ProjectGroupsModel.destroy({ where: {} });
    await UserModel.destroy({ where: {} });
    await ProjectModel.destroy({ where: {} });
  });

  afterAll(async () => {
    try {
      // await db.close();
      await app.close();
    } catch (e) {
      console.log(e);
    }
  });

  describe('listMembersUseCase', () => {
    it('should list project members', async () => {
      await ProjectModel.bulkCreate([project1, project2, project3, project4, project5, project6]);
      await UserModel.bulkCreate([user1, user2, user3, user4, user5, user6, user7]);
      await GroupModel.bulkCreate([group1, group2, group3, group4, group5]);
      await GroupsMembersModel.bulkCreate([
        { groupId: group1.id, userId: user1.id },
        { groupId: group2.id, userId: user1.id },
        { groupId: group3.id, userId: user1.id },
        { groupId: group4.id, userId: user1.id },
        { groupId: group4.id, userId: user3.id },
        { groupId: group4.id, userId: user2.id },
        { groupId: group1.id, userId: user2.id },
      ]);
      await GroupHierarchyModel.bulkCreate([
        { parentGroupId: group1.id, childGroupId: group3.id },
        { parentGroupId: group2.id, childGroupId: group3.id },
      ]);
      await ProjectsMembersModel.bulkCreate([
        { projectId: project1.id, userId: user1.id },
        { projectId: project1.id, userId: user2.id },
        { projectId: project2.id, userId: user2.id },
        { projectId: project3.id, userId: user2.id },
        { projectId: project4.id, userId: user2.id },
        { projectId: project5.id, userId: user2.id },
        { projectId: project6.id, userId: user2.id },
      ]);

      const response = await request(app.getHttpServer()).get(`/projects/${project1.id}/members`);
      expect(response.status).toStrictEqual(200);

      expect(response.body).toEqual([
        {
          id: user1.id,
          name: `${user1.firstName} ${user1.lastName}`,
          groups: expect.arrayContaining([group1.name, group2.name, group3.name, group4.name]),
        },
        {
          id: user2.id,
          name: `${user2.firstName} ${user2.lastName}`,
          groups: expect.arrayContaining([group1.name, group3.name, group4.name]),
        },
      ]);
    });

    it('should throw if project does not exist', async () => {
      return request(app.getHttpServer())
        .get(`/projects/${project1.id}/members`)
        .expect(404)
        .expect({ message: 'Project not found', error: 'Not Found', statusCode: 404 });
    });
  });

  describe('addMembersUseCase', () => {
    it('should add members to project', async () => {
      await ProjectModel.bulkCreate([project1, project2, project3]);
      await UserModel.bulkCreate([user1, user2, user3, user4, user5, user6, user7]);

      const projectMembers = await ProjectsMembersModel.findAll({
        where: { projectId: project1.id },
      });
      expect(projectMembers.length).toEqual(0);

      await request(app.getHttpServer())
        .post(`/projects/${project1.id}/users-members`)
        .send({ userIds: [user1.id, user2.id] })
        .expect(201)
        .expect([
          { id: user1.id, name: `${user1.firstName} ${user1.lastName}` },
          { id: user2.id, name: `${user2.firstName} ${user2.lastName}` },
        ]);

      const updatedProjectMembers = await ProjectsMembersModel.findAll({
        where: { projectId: project1.id },
      });
      expect(updatedProjectMembers.length).toEqual(2);
    });

    it('should throw if project does not exist', async () => {
      return request(app.getHttpServer())
        .post(`/projects/${project1.id}/users-members`)
        .send({ userIds: [user1.id, user2.id] })
        .expect(404)
        .expect({ message: 'Project not found', error: 'Not Found', statusCode: 404 });
    });

    it('should throw if at least one of the user does not exist', async () => {
      await ProjectModel.bulkCreate([project1, project2, project3]);
      await UserModel.bulkCreate([user1, user5, user6, user7]);

      return request(app.getHttpServer())
        .post(`/projects/${project1.id}/users-members`)
        .send({ userIds: [user1.id, user2.id] })
        .expect(400)
        .expect({
          message: "batch addition failed and user couldn't be found",
          error: 'Bad Request',
          statusCode: 400,
        });
    });

    it('should throw if one of the user is already a member', async () => {
      await ProjectModel.bulkCreate([project1, project2, project3]);
      await UserModel.bulkCreate([user1, user5, user6, user7]);
      await ProjectsMembersModel.bulkCreate([{ projectId: project1.id, userId: user1.id }]);

      return request(app.getHttpServer())
        .post(`/projects/${project1.id}/users-members`)
        .send({ userIds: [user1.id, user2.id] })
        .expect(400)
        .expect({
          message: 'One of the user is already a member of project',
          error: 'Bad Request',
          statusCode: 400,
        });
    });
  });

  describe('removeMemberUseCase', () => {
    it('should remove member from project', async () => {
      await ProjectModel.bulkCreate([project1, project2, project3]);
      await UserModel.bulkCreate([user1, user2, user3, user4, user5, user6, user7]);
      await ProjectsMembersModel.bulkCreate([
        { projectId: project1.id, userId: user1.id },
        { projectId: project1.id, userId: user2.id },
      ]);

      const projectMembers = await ProjectsMembersModel.findAll({
        where: { projectId: project1.id },
      });
      expect(projectMembers.length).toEqual(2);

      await request(app.getHttpServer())
        .delete(`/projects/${project1.id}/members/${user1.id}`)
        .expect(200)
        .expect({ projectId: project1.id, userId: user1.id });

      const updatedProjectMembers = await ProjectsMembersModel.findAll({
        where: { projectId: project1.id },
      });

      expect(updatedProjectMembers.length).toEqual(1);
    });

    it('should throw if project does not exist', async () => {
      return request(app.getHttpServer())
        .delete(`/projects/${project1.id}/members/${user1.id}`)
        .expect(404)
        .expect({ message: 'Project not found', error: 'Not Found', statusCode: 404 });
    });

    it('should throw if user does not exist', async () => {
      await ProjectModel.bulkCreate([project1, project2, project3]);
      await UserModel.bulkCreate([user2, user3, user4, user5, user6, user7]);
      await ProjectsMembersModel.bulkCreate([
        { projectId: project1.id, userId: user2.id },
        { projectId: project1.id, userId: user3.id },
        { projectId: project1.id, userId: user4.id },
      ]);

      return request(app.getHttpServer())
        .delete(`/projects/${project1.id}/members/${user1.id}`)
        .expect(404)
        .expect({
          message: `User with ID ${user1.id} not found`,
          error: 'Not Found',
          statusCode: 404,
        });
    });

    it('should throw if user was not a member', async () => {
      await ProjectModel.bulkCreate([project1, project2, project3]);
      await UserModel.bulkCreate([user1, user2, user3, user4, user5, user6, user7]);
      await ProjectsMembersModel.bulkCreate([
        { projectId: project1.id, userId: user2.id },
        { projectId: project1.id, userId: user3.id },
        { projectId: project1.id, userId: user4.id },
      ]);

      return request(app.getHttpServer())
        .delete(`/projects/${project1.id}/members/${user1.id}`)
        .expect(400)
        .expect({
          message: `User with ID ${user1.id} is not a member of project with ID ${project1.id}`,
          error: 'Bad Request',
          statusCode: 400,
        });
    });
  });

  describe('addGroupsUseCase', () => {
    it('should add groups to project', async () => {
      await ProjectModel.bulkCreate([project1, project2]);
      await GroupModel.bulkCreate([group1, group2, group3]);
      await GroupHierarchyModel.bulkCreate([
        { parentGroupId: group1.id, childGroupId: group3.id },
        { parentGroupId: group2.id, childGroupId: group3.id },
      ]);
      await UserModel.bulkCreate([user1, user2, user3, user4, user5, user6, user7]);

      const response = await request(app.getHttpServer())
        .post(`/projects/${project1.id}/groups-members`)
        .send({ groupIds: [group2.id] });

      expect(response.status).toStrictEqual(201);
      expect(response.body).toStrictEqual([group2.id]);
    });

    it('should throw if group does not exist', async () => {
      return request(app.getHttpServer())
        .post(`/projects/${project1.id}/groups-members`)
        .send({ groupIds: [group1.id, group2.id] })
        .expect(404)
        .expect({ message: 'Group not found', error: 'Not Found', statusCode: 404 });
    });

    it('should throw if at least one of the group does not exist', async () => {
      await ProjectModel.bulkCreate([project1]);
      await GroupModel.bulkCreate([group1]);

      return request(app.getHttpServer())
        .post(`/projects/${project1.id}/groups-members`)
        .send({ groupIds: [group2.id] })
        .expect(400)
        .expect({
          message: "batch addition failed a group couldn't be found",
          error: 'Bad Request',
          statusCode: 400,
        });
    });

    it('should throw if one of the group is already a member', async () => {
      await ProjectModel.bulkCreate([project1]);
      await GroupModel.bulkCreate([group1, group2, group3]);
      await ProjectGroupsModel.bulkCreate([{ projectId: project1.id, groupId: group1.id }]);
      return request(app.getHttpServer())
        .post(`/projects/${project1.id}/groups-members`)
        .send({ groupIds: [group1.id, group2.id] })
        .expect(400)
        .expect({
          message: 'One of the group is already a member of this project',
          error: 'Bad Request',
          statusCode: 400,
        });
    });
  });
});
