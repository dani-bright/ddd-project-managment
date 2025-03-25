import { User } from '../../users/domain/user.entity';

export class Project {
  constructor(
    public readonly id: number,
    public name: string,
    public users: User[],
  ) {}
}
