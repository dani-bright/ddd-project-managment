import { Module } from '@nestjs/common';

import { SequelizeModule } from '@nestjs/sequelize';
import { UserModel } from './infrastructure/sequelize/users.model';

@Module({
  imports: [SequelizeModule.forFeature([UserModel])],
  exports: [SequelizeModule],
})
export class UsersModule {}
