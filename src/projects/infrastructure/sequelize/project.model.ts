import { Table, Column, Model, DataType, BelongsToMany, ForeignKey } from 'sequelize-typescript';
import { UserModel } from '../../../users/infrastructure/sequelize/users.model';
import { ProjectGroupsModel, ProjectsMembersModel } from './projects-members.model';
import { CreationOptional } from 'sequelize';
import { GroupModel } from '../../../groups/infrastructure/sequelize/groups.model';

@Table({ tableName: 'projects', timestamps: false })
export class ProjectModel extends Model {
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

  @BelongsToMany(() => UserModel, () => ProjectsMembersModel)
  users: UserModel[];

  @BelongsToMany(() => GroupModel, () => ProjectGroupsModel)
  groups: GroupModel[];

  @Column({
    type: 'datetime',
    defaultValue: DataType.NOW,
    allowNull: false,
    field: 'created_at',
  })
  declare createdAt: CreationOptional<Date>;
}
