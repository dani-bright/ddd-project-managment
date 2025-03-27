export interface AddedMember {
  id: number;
  name: string;
}

export interface GroupProjectRepository {
  addUsers(projectId: number, userIds: number[]): Promise<AddedMember[]>;
  addGroups(projectId: number, groupIds: number[]): Promise<number[]>;
}
