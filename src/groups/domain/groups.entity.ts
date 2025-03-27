import { User } from '../../users/domain/user.entity';

export class Group {
  constructor(
    public readonly id: number,
    public name: string,
    public users: User[],
  ) {}
}
