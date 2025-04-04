import { Table, Column, Model, DataType, BelongsToMany, ForeignKey } from 'sequelize-typescript';
import { UserModel } from '../../../users/infrastructure/sequelize/users.model';
import { ProjectModel } from './project.model';
import { CreationOptional } from 'sequelize';
import { GroupModel } from '../../../groups/infrastructure/sequelize/groups.model';

@Table({
  tableName: 'projects_members',
  timestamps: false,
})
export class ProjectsMembersModel extends Model {
  @ForeignKey(() => ProjectModel)
  @Column({
    type: 'text',
    allowNull: false,
    field: 'project_id',
  })
  projectId: number;

  @ForeignKey(() => UserModel)
  @Column({
    type: 'text',
    allowNull: false,
    field: 'user_id',
  })
  userId: number;

  @Column({
    type: 'datetime',
    defaultValue: DataType.NOW,
    allowNull: false,
    field: 'created_at',
  })
  declare createdAt: CreationOptional<Date>;
}

@Table({ tableName: 'project_groups', timestamps: false })
export class ProjectGroupsModel extends Model {
  @ForeignKey(() => ProjectModel)
  @Column
  projectId: number;

  @ForeignKey(() => GroupModel)
  @Column
  groupId: number;
}
