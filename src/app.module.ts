import { Module } from '@nestjs/common';

import { SequelizeModule } from '@nestjs/sequelize';
import { ProjectsModule } from './projects/projects.module';
import { ProjectsController } from './projects/infrastructure/projects.controller';
import { ProjectModel } from './projects/infrastructure/sequelize/project.model';
import { UserModel } from './users/infrastructure/sequelize/users.model';
import { ProjectsMembers } from './projects/infrastructure/sequelize/projects-members.model';

@Module({
  imports: [
    SequelizeModule.forRoot({
      dialect: 'sqlite',
      storage: '../projects.db',
      models: [ProjectModel, UserModel, ProjectsMembers],
    }),
    ProjectsModule,
  ],
  controllers: [ProjectsController],
  providers: [],
})
export class AppModule {}
