import { CreationOptional } from 'sequelize';
import { Table, Column, Model, DataType, BelongsToMany } from 'sequelize-typescript';
import { ProjectModel } from '../../../projects/infrastructure/sequelize/project.model';
import { ProjectsMembersModel } from '../../../projects/infrastructure/sequelize/projects-members.model';
import { GroupModel } from '../../../groups/infrastructure/sequelize/groups.model';
import { GroupsMembersModel } from '../../../groups/infrastructure/sequelize/group-members.model';

@Table({ tableName: 'users', timestamps: false })
export class UserModel extends Model {
  @Column({
    type: 'integer',
    primaryKey: true,
  })
  declare id: number;

  @Column({
    type: 'text',
    allowNull: false,
    field: 'first_name',
  })
  firstName: string;

  @Column({
    type: 'text',
    allowNull: false,
    field: 'last_name',
  })
  lastName: string;

  @Column({
    type: 'datetime',
    defaultValue: DataType.NOW,
    allowNull: false,
    field: 'created_at',
  })
  declare createdAt: CreationOptional<Date>;

  @BelongsToMany(() => ProjectModel, () => ProjectsMembersModel)
  projects: ProjectModel[];

  @BelongsToMany(() => GroupModel, () => GroupsMembersModel)
  groups: GroupModel[];
}
