import { Table, Column, Model, DataType, BelongsToMany, ForeignKey } from 'sequelize-typescript';
import { UserModel } from '../../../users/infrastructure/sequelize/users.model';
import { ProjectModel } from './project.model';
import { CreationOptional } from 'sequelize';

@Table({
  tableName: 'projects_members',
  timestamps: false,
})
export class ProjectsMembers extends Model {
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
