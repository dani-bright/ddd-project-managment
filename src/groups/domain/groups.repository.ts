import { Group } from './groups.entity';
import { RemoveUserDto } from '../dto/remove-user.dto';
import { GroupProjectRepository } from '../../shared/domain/groups-project.repository';

export interface GroupRepository extends GroupProjectRepository {
  get(id: number): Promise<Group | null>;
  removeUser(data: RemoveUserDto): Promise<void>;
}
