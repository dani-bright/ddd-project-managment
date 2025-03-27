import { Module } from '@nestjs/common';
import { AddUsersToGroupUseCase } from './application/use-cases/add-users-to-group';
import { SequelizeGroupRepository } from './infrastructure/sequelize/groups.repository';
import { GroupsController } from './infrastructure/groups.controller';
import { SequelizeModule } from '@nestjs/sequelize';
import { GroupModel } from './infrastructure/sequelize/groups.model';
import { UsersModule } from '../users/users.module';
import { RemoveUserFromGroupUseCase } from './application/use-cases/remove-users-from-group';
import { AddGroupsToGroupUseCase } from './application/use-cases/add-groups-to-group';

@Module({
  imports: [SequelizeModule.forFeature([GroupModel]), UsersModule],
  controllers: [GroupsController],
  providers: [
    SequelizeGroupRepository,
    {
      provide: AddUsersToGroupUseCase,
      useFactory: (repo: SequelizeGroupRepository) => new AddUsersToGroupUseCase(repo),
      inject: [SequelizeGroupRepository],
    },
    {
      provide: AddGroupsToGroupUseCase,
      useFactory: (repo: SequelizeGroupRepository) => new AddGroupsToGroupUseCase(repo),
      inject: [SequelizeGroupRepository],
    },
    {
      provide: RemoveUserFromGroupUseCase,
      useFactory: (repo: SequelizeGroupRepository) => new RemoveUserFromGroupUseCase(repo),
      inject: [SequelizeGroupRepository],
    },
  ],
  exports: [
    AddUsersToGroupUseCase,
    RemoveUserFromGroupUseCase,
    AddGroupsToGroupUseCase,
    SequelizeGroupRepository,
    SequelizeModule,
  ],
})
export class GroupsModule {}
