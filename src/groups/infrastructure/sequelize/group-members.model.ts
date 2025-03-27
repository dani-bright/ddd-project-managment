import { Table, Column, Model, DataType, BelongsToMany, ForeignKey } from 'sequelize-typescript';
import { UserModel } from '../../../users/infrastructure/sequelize/users.model';
import { GroupModel } from './groups.model';
import { CreationOptional } from 'sequelize';

@Table({
  tableName: 'groups_members',
  timestamps: false,
})
export class GroupsMembersModel extends Model {
  @ForeignKey(() => GroupModel)
  @Column({
    type: 'text',
    allowNull: false,
    field: 'group_id',
  })
  groupId: number;

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

@Table({ tableName: 'group_hierarchy', timestamps: false })
export class GroupHierarchyModel extends Model {
  @ForeignKey(() => GroupModel)
  @Column
  parentGroupId: number;

  @ForeignKey(() => GroupModel)
  @Column
  childGroupId: number;
}
