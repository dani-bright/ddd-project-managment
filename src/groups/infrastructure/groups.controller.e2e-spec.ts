import { Test, TestingModule } from '@nestjs/testing';
import { GroupsController } from './groups.controller';
import { GroupModel } from './sequelize/groups.model';
import { SequelizeModule } from '@nestjs/sequelize';
import { GroupsMembersModel, GroupHierarchyModel } from './sequelize/group-members.model';
import { INestApplication } from '@nestjs/common';
import { Sequelize } from 'sequelize-typescript';
import { GroupsModule } from '../groups.module';
import { UserModel } from '../../users/infrastructure/sequelize/users.model';
import * as request from 'supertest';
import { ProjectModel } from '../../projects/infrastructure/sequelize/project.model';
import {
  ProjectGroupsModel,
  ProjectsMembersModel,
} from '../../projects/infrastructure/sequelize/projects-members.model';
import {
  group1,
  group2,
  group3,
  user1,
  user2,
  user3,
  user4,
  user5,
  user6,
  user7,
  group4,
  group5,
  group6,
  group7,
  group8,
} from '../../tests/mocks';

describe('GroupsController (E2E)', () => {
  let app: INestApplication;
  let controller: GroupsController;
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
        GroupsModule,
      ],
      controllers: [GroupsController],
    }).compile();

    app = module.createNestApplication();
    await app.init();

    controller = module.get<GroupsController>(GroupsController);
    db = module.get<Sequelize>(Sequelize);
    await db.sync({ force: true });
  });

  afterEach(async () => {
    await GroupHierarchyModel.destroy({ where: {} });
    await GroupsMembersModel.destroy({ where: {} });
    await UserModel.destroy({ where: {} });
    await GroupModel.destroy({ where: {} });
  });

  afterAll(async () => {
    try {
      // await db.close();
      await app.close();
    } catch (e) {
      console.log(e);
    }
  });

  describe('addUsersUseCase', () => {
    it('should add members to group', async () => {
      await GroupModel.bulkCreate([group1, group2, group3]);
      await UserModel.bulkCreate([user1, user2, user3, user4, user5, user6, user7]);

      const groupMembers = await GroupsMembersModel.findAll({ where: { groupId: group1.id } });
      expect(groupMembers.length).toEqual(0);

      await request(app.getHttpServer())
        .post(`/groups/${group1.id}/users-members`)
        .send({ userIds: [user1.id, user2.id] })
        .expect(201)
        .expect([
          { id: user1.id, name: `${user1.firstName} ${user1.lastName}` },
          { id: user2.id, name: `${user2.firstName} ${user2.lastName}` },
        ]);

      const updatedGroupMembers = await GroupsMembersModel.findAll({
        where: { groupId: group1.id },
      });
      expect(updatedGroupMembers.length).toEqual(2);
    });

    it('should throw if group does not exist', async () => {
      return request(app.getHttpServer())
        .post(`/groups/${group1.id}/users-members`)
        .send({ userIds: [user1.id, user2.id] })
        .expect(404)
        .expect({ message: 'Group not found', error: 'Not Found', statusCode: 404 });
    });

    it('should throw if at least one of the user does not exist', async () => {
      await GroupModel.bulkCreate([group1, group2, group3]);
      await UserModel.bulkCreate([user1, user5, user6, user7]);

      return request(app.getHttpServer())
        .post(`/groups/${group1.id}/users-members`)
        .send({ userIds: [user1.id, user2.id] })
        .expect(400)
        .expect({
          message: "batch addition failed and user couldn't be found",
          error: 'Bad Request',
          statusCode: 400,
        });
    });

    it('should throw if one of the user is already a member', async () => {
      await GroupModel.bulkCreate([group1, group2, group3]);
      await UserModel.bulkCreate([user1, user5, user6, user7]);
      await GroupsMembersModel.bulkCreate([{ groupId: group1.id, userId: user1.id }]);

      return request(app.getHttpServer())
        .post(`/groups/${group1.id}/users-members`)
        .send({ userIds: [user1.id, user2.id] })
        .expect(400)
        .expect({
          message: 'One of the user is already a member of group',
          error: 'Bad Request',
          statusCode: 400,
        });
    });
  });

  describe('addGroupsUseCase', () => {
    it('should add groups to group', async () => {
      await GroupModel.bulkCreate([group1, group2, group3]);
      await GroupHierarchyModel.bulkCreate([
        { parentGroupId: group1.id, childGroupId: group3.id },
        { parentGroupId: group2.id, childGroupId: group3.id },
      ]);
      await UserModel.bulkCreate([user1, user2, user3, user4, user5, user6, user7]);

      const response = await request(app.getHttpServer())
        .post(`/groups/${group1.id}/groups-members`)
        .send({ groupIds: [group2.id] });

      expect(response.status).toStrictEqual(201);
      expect(response.body).toStrictEqual([group2.id]);
    });

    it('should throw if group does not exist', async () => {
      return request(app.getHttpServer())
        .post(`/groups/${group1.id}/groups-members`)
        .send({ userIds: [user1.id, user2.id] })
        .expect(404)
        .expect({ message: 'Group not found', error: 'Not Found', statusCode: 404 });
    });

    it('should throw if trying to add group to itself', async () => {
      await GroupModel.bulkCreate([group1]);
      await UserModel.bulkCreate([user1, user5, user6, user7]);

      return request(app.getHttpServer())
        .post(`/groups/${group1.id}/groups-members`)
        .send({ groupIds: [group1.id] })
        .expect(400)
        .expect({
          message: "can't add group to itself",
          error: 'Bad Request',
          statusCode: 400,
        });
    });

    it('should throw if at least one of the group does not exist', async () => {
      await GroupModel.bulkCreate([group1]);
      await UserModel.bulkCreate([user1, user5, user6, user7]);

      return request(app.getHttpServer())
        .post(`/groups/${group1.id}/groups-members`)
        .send({ groupIds: [group2.id] })
        .expect(400)
        .expect({
          message: "batch addition failed a group couldn't be found",
          error: 'Bad Request',
          statusCode: 400,
        });
    });

    it('should throw if one of the group is already a member', async () => {
      await GroupModel.bulkCreate([group1, group2, group3]);
      await UserModel.bulkCreate([user1, user5, user6, user7]);
      await GroupHierarchyModel.bulkCreate([{ parentGroupId: group1.id, childGroupId: group3.id }]);

      return request(app.getHttpServer())
        .post(`/groups/${group3.id}/groups-members`)
        .send({ groupIds: [group1.id, group2.id] })
        .expect(400)
        .expect({
          message: 'One of the group is already a member of group',
          error: 'Bad Request',
          statusCode: 400,
        });
    });

    it('should throw if trying to add more than 5 nested groups', async () => {
      await GroupModel.bulkCreate([group1, group2, group3, group4, group5, group6, group7, group8]);
      await GroupHierarchyModel.bulkCreate([
        { parentGroupId: group1.id, childGroupId: group2.id },
        { parentGroupId: group1.id, childGroupId: group3.id },
        { parentGroupId: group3.id, childGroupId: group4.id },
        { parentGroupId: group4.id, childGroupId: group5.id },
        { parentGroupId: group5.id, childGroupId: group6.id },
      ]);

      return request(app.getHttpServer())
        .post(`/groups/${group1.id}/groups-members`)
        .send({ groupIds: [group8.id] })
        .expect(400)
        .expect({
          message: 'You cannot add other groups in the current group',
          error: 'Bad Request',
          statusCode: 400,
        });
    });
  });

  describe('removeMemberUseCase', () => {
    it('should remove member from group', async () => {
      await GroupModel.bulkCreate([group1, group2, group3]);
      await UserModel.bulkCreate([user1, user2, user3, user4, user5, user6, user7]);
      await GroupsMembersModel.bulkCreate([
        { groupId: group1.id, userId: user1.id },
        { groupId: group1.id, userId: user2.id },
      ]);

      const groupMembers = await GroupsMembersModel.findAll({ where: { groupId: group1.id } });
      expect(groupMembers.length).toEqual(2);

      await request(app.getHttpServer())
        .delete(`/groups/${group1.id}/members/${user1.id}`)
        .expect(200)
        .expect({ groupId: group1.id, userId: user1.id });

      const updatedGroupMembers = await GroupsMembersModel.findAll({
        where: { groupId: group1.id },
      });

      expect(updatedGroupMembers.length).toEqual(1);
    });

    it('should throw if group does not exist', async () => {
      return request(app.getHttpServer())
        .delete(`/groups/${group1.id}/members/${user1.id}`)
        .expect(404)
        .expect({ message: 'Group not found', error: 'Not Found', statusCode: 404 });
    });

    it('should throw if user does not exist', async () => {
      await GroupModel.bulkCreate([group1, group2, group3]);
      await UserModel.bulkCreate([user2, user3, user4, user5, user6, user7]);
      await GroupsMembersModel.bulkCreate([
        { groupId: group1.id, userId: user2.id },
        { groupId: group1.id, userId: user3.id },
        { groupId: group1.id, userId: user4.id },
      ]);

      return request(app.getHttpServer())
        .delete(`/groups/${group1.id}/members/${user1.id}`)
        .expect(404)
        .expect({
          message: `User with ID ${user1.id} not found`,
          error: 'Not Found',
          statusCode: 404,
        });
    });

    it('should throw if user was not a member', async () => {
      await GroupModel.bulkCreate([group1, group2, group3]);
      await UserModel.bulkCreate([user1, user2, user3, user4, user5, user6, user7]);
      await GroupsMembersModel.bulkCreate([
        { groupId: group1.id, userId: user2.id },
        { groupId: group1.id, userId: user3.id },
        { groupId: group1.id, userId: user4.id },
      ]);

      return request(app.getHttpServer())
        .delete(`/groups/${group1.id}/members/${user1.id}`)
        .expect(400)
        .expect({
          message: `User with ID ${user1.id} is not a member of group with ID ${group1.id}`,
          error: 'Bad Request',
          statusCode: 400,
        });
    });
  });
});
