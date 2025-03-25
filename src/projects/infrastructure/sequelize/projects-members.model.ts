import { Table, Column, Model, DataType, BelongsToMany, ForeignKey } from 'sequelize-typescript';
import { UserModel } from 'src/users/infrastructure/sequelize/users.model';
import { ProjectModel } from './project.model';
import { CreationOptional } from 'sequelize';

@Table({
  tableName: 'projects_members',
  timestamps: false,
})
export class ProjectsMembers extends Model {
  @ForeignKey(() => ProjectModel)
  @Column
  project_id: number;

  @ForeignKey(() => UserModel)
  @Column
  user_id: number;

  @Column({
    type: 'datetime',
    defaultValue: DataType.NOW,
    allowNull: false,
    field: 'created_at',
  })
  declare createdAt: CreationOptional<Date>;
}
