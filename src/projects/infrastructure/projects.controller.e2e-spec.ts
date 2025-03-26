import { Test, TestingModule } from '@nestjs/testing';
import { ProjectsController } from './projects.controller';
import { AddMembersToProjectUseCase } from '../application/use-cases/add-members-to-project';
import { ListProjectMemberUseCase } from '../application/use-cases/list-project-members';
import { RemoveMemberFromProjectUseCase } from '../application/use-cases/remove-member-from-project';
import { ProjectModel } from './sequelize/project.model';
import { SequelizeModule } from '@nestjs/sequelize';
import { ProjectsMembers } from './sequelize/projects-members.model';
import { INestApplication } from '@nestjs/common';
import { Sequelize } from 'sequelize-typescript';
import { ProjectsModule } from '../projects.module';
import { UserModel } from '../../users/infrastructure/sequelize/users.model';
import * as request from 'supertest';

describe('ProjectsController (E2E)', () => {
  let app: INestApplication;
  let controller: ProjectsController;
  let db: Sequelize;
  const user1 = { id: 1, firstName: 'Alice', lastName: 'Merveille' };
  const user2 = { id: 2, firstName: 'Jean', lastName: 'Bon' };
  const user3 = { id: 3, firstName: 'Alex', lastName: 'Terieur' };
  const user4 = { id: 4, firstName: 'Alain', lastName: 'Verse' };
  const user5 = { id: 5, firstName: 'Harry', lastName: 'Cover' };
  const user6 = { id: 6, firstName: 'Jean', lastName: 'Peuplu' };
  const user7 = { id: 7, firstName: 'Patrice', lastName: 'Heureu' };
  const project1 = { id: 1, name: 'WIMI' };
  const project2 = { id: 2, name: 'EDC' };
  const project3 = { id: 3, name: 'WTN' };
  const project4 = { id: 4, name: 'BEYABLE' };
  const project5 = { id: 5, name: 'VE' };
  const project6 = { id: 6, name: 'SMART' };

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        SequelizeModule.forRoot({
          dialect: 'sqlite',
          storage: ':memory:',
          models: [ProjectModel, ProjectsMembers, UserModel],
          autoLoadModels: true,
          synchronize: true,
          logging: false,
        }),
        ProjectsModule,
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
    await ProjectsMembers.destroy({ where: {} });
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
      await ProjectsMembers.bulkCreate([
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
          projects: expect.arrayContaining([project1.name]),
        },
        {
          id: user2.id,
          name: `${user2.firstName} ${user2.lastName}`,
          projects: expect.arrayContaining([
            project1.name,
            project3.name,
            project3.name,
            project4.name,
            project5.name,
            project6.name,
          ]),
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

      const projectMembers = await ProjectsMembers.findAll({ where: { projectId: project1.id } });
      expect(projectMembers.length).toEqual(0);

      await request(app.getHttpServer())
        .post(`/projects/${project1.id}/members`)
        .send({ userIds: [user1.id, user2.id] })
        .expect(201)
        .expect([
          { id: user1.id, name: `${user1.firstName} ${user1.lastName}` },
          { id: user2.id, name: `${user2.firstName} ${user2.lastName}` },
        ]);

      const updatedProjectMembers = await ProjectsMembers.findAll({
        where: { projectId: project1.id },
      });
      expect(updatedProjectMembers.length).toEqual(2);
    });

    it('should throw if project does not exist', async () => {
      return request(app.getHttpServer())
        .post(`/projects/${project1.id}/members`)
        .send({ userIds: [user1.id, user2.id] })
        .expect(404)
        .expect({ message: 'Project not found', error: 'Not Found', statusCode: 404 });
    });

    it('should throw if at least one of the user does not exist', async () => {
      await ProjectModel.bulkCreate([project1, project2, project3]);
      await UserModel.bulkCreate([user1, user5, user6, user7]);

      return request(app.getHttpServer())
        .post(`/projects/${project1.id}/members`)
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
      await ProjectsMembers.bulkCreate([{ projectId: project1.id, userId: user1.id }]);

      return request(app.getHttpServer())
        .post(`/projects/${project1.id}/members`)
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
      await ProjectsMembers.bulkCreate([
        { projectId: project1.id, userId: user1.id },
        { projectId: project1.id, userId: user2.id },
      ]);

      const projectMembers = await ProjectsMembers.findAll({ where: { projectId: project1.id } });
      expect(projectMembers.length).toEqual(2);

      await request(app.getHttpServer())
        .delete(`/projects/${project1.id}/members/${user1.id}`)
        .expect(200)
        .expect({ projectId: project1.id, userId: user1.id });

      const updatedProjectMembers = await ProjectsMembers.findAll({
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
      await ProjectsMembers.bulkCreate([
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
      await ProjectsMembers.bulkCreate([
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
});
