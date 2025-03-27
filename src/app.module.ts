import { Module } from '@nestjs/common';

import { SequelizeModule } from '@nestjs/sequelize';
import { ProjectsModule } from './projects/projects.module';
import { ProjectsController } from './projects/infrastructure/projects.controller';
import { ProjectModel } from './projects/infrastructure/sequelize/project.model';
import { UserModel } from './users/infrastructure/sequelize/users.model';
import {
  ProjectGroupsModel,
  ProjectsMembersModel,
} from './projects/infrastructure/sequelize/projects-members.model';
import { GroupModel } from './groups/infrastructure/sequelize/groups.model';
import {
  GroupHierarchyModel,
  GroupsMembersModel,
} from './groups/infrastructure/sequelize/group-members.model';

@Module({
  imports: [
    SequelizeModule.forRoot({
      dialect: 'sqlite',
      storage: '../projects.db',
      models: [
        ProjectModel,
        UserModel,
        ProjectsMembersModel,
        GroupModel,
        GroupsMembersModel,
        GroupHierarchyModel,
        ProjectGroupsModel,
      ],
      synchronize: true,
      autoLoadModels: true,
    }),
    ProjectsModule,
  ],
  controllers: [ProjectsController],
  providers: [],
})
export class AppModule {}
