import { RemoveMemberDto } from '../dto/remove-member.dto';
import { Project } from './projects.entity';

export interface AddedMember {
  id: number;
  name: string;
}

export interface ProjectRepository {
  get(id: number): Promise<Project | null>;
  listMembers(id: number): Promise<Project | null>;
  addMembers(projectId: number, userIds: number[]): Promise<AddedMember[]>;
  removeMember(data: RemoveMemberDto): Promise<void>;
}
