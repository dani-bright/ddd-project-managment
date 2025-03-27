import { Table, Column, Model, DataType, BelongsToMany } from 'sequelize-typescript';
import { UserModel } from '../../../users/infrastructure/sequelize/users.model';
import { CreationOptional } from 'sequelize';
import { GroupHierarchyModel, GroupsMembersModel } from './group-members.model';
import { ProjectModel } from '../../../projects/infrastructure/sequelize/project.model';
import { ProjectGroupsModel } from '../../../projects/infrastructure/sequelize/projects-members.model';

@Table({ tableName: 'groups', timestamps: false })
export class GroupModel extends Model {
  @Column({
    type: 'integer',
    primaryKey: true,
    allowNull: false,
  })
  declare id: number;

  @Column({
    type: 'text',
    allowNull: false,
  })
  name: string;

  @BelongsToMany(() => UserModel, () => GroupsMembersModel)
  users: UserModel[];

  @BelongsToMany(() => GroupModel, () => GroupHierarchyModel, 'parentGroupId', 'childGroupId')
  subGroups: GroupModel[];

  @BelongsToMany(() => GroupModel, () => GroupHierarchyModel, 'childGroupId', 'parentGroupId')
  parentGroups: GroupModel[];

  @BelongsToMany(() => ProjectModel, () => ProjectGroupsModel)
  projects: ProjectModel[];

  @Column({
    type: 'datetime',
    defaultValue: DataType.NOW,
    allowNull: false,
    field: 'created_at',
  })
  declare createdAt: CreationOptional<Date>;
}
