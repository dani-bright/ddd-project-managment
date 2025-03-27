import { RemoveUserDto } from '../dto/remove-user.dto';
import { Project } from './projects.entity';
import { GroupProjectRepository } from '../../shared/domain/groups-project.repository';

export interface ProjectRepository extends GroupProjectRepository {
  get(id: number): Promise<Project | null>;
  listMembers(id: number): Promise<Project | null>;
  removeUsers(data: RemoveUserDto): Promise<void>;
}
