import { Table, Column, Model, DataType, BelongsToMany, ForeignKey } from 'sequelize-typescript';
import { UserModel } from 'src/users/infrastructure/sequelize/users.model';
import { ProjectsMembers } from './projects-members.model';
import { CreationOptional } from 'sequelize';

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

  @BelongsToMany(() => UserModel, () => ProjectsMembers)
  users: UserModel[];

  @Column({
    type: 'datetime',
    defaultValue: DataType.NOW,
    allowNull: false,
    field: 'created_at',
  })
  declare createdAt: CreationOptional<Date>;
}
