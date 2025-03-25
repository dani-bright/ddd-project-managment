import { RemoveMemberDto } from '../dto/remove-member.dto';
import { Project } from './projects.entity';

export interface ProjectRepository {
  listMembers(id: number): Promise<Project | null>;
  addUser(projectId: number, userIds: number[]): Promise<void>;
  removeMember(data: RemoveMemberDto): Promise<void>;
}
