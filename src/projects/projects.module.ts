import { Module } from '@nestjs/common';
import { AddMembersToProjectUseCase } from './application/use-cases/add-members-to-project';
import { SequelizeProjectRepository } from './infrastructure/sequelize/projects.repository';
import { ProjectsController } from './infrastructure/projects.controller';
import { SequelizeModule } from '@nestjs/sequelize';
import { ProjectModel } from './infrastructure/sequelize/project.model';
import { UsersModule } from '../users/users.module';
import { ListProjectMemberUseCase } from './application/use-cases/list-project-members';
import { RemoveMemberFromProjectUseCase } from './application/use-cases/remove-member-from-project';
import { GroupsModule } from '../groups/groups.module';
import { AddGroupsToProjectUseCase } from './application/use-cases/add-groups-to-project';

@Module({
  imports: [SequelizeModule.forFeature([ProjectModel]), UsersModule, GroupsModule],
  controllers: [ProjectsController],
  providers: [
    SequelizeProjectRepository,
    {
      provide: AddMembersToProjectUseCase,
      useFactory: (repo: SequelizeProjectRepository) => new AddMembersToProjectUseCase(repo),
      inject: [SequelizeProjectRepository],
    },
    {
      provide: ListProjectMemberUseCase,
      useFactory: (repo: SequelizeProjectRepository) => new ListProjectMemberUseCase(repo),
      inject: [SequelizeProjectRepository],
    },
    {
      provide: RemoveMemberFromProjectUseCase,
      useFactory: (repo: SequelizeProjectRepository) => new RemoveMemberFromProjectUseCase(repo),
      inject: [SequelizeProjectRepository],
    },
    {
      provide: AddGroupsToProjectUseCase,
      useFactory: (repo: SequelizeProjectRepository) => new AddGroupsToProjectUseCase(repo),
      inject: [SequelizeProjectRepository],
    },
  ],
  exports: [
    AddMembersToProjectUseCase,
    ListProjectMemberUseCase,
    RemoveMemberFromProjectUseCase,
    AddGroupsToProjectUseCase,
    SequelizeProjectRepository,
  ],
})
export class ProjectsModule {}
