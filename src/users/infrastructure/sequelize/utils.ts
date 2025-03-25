import { UserModel } from './users.model';

export const extractUser = (users: UserModel[]) =>
  users.map(({ dataValues: { id, firstName, lastName } }) => ({
    id,
    name: `${firstName} ${lastName}`,
  }));
