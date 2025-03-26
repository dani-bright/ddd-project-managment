import { UserModel } from './users.model';

export const extractUser = (users: UserModel[], withProjects = true) =>
  users.map(({ dataValues: { id, firstName, lastName, projects } }) => ({
    id,
    name: `${firstName} ${lastName}`,
    ...(withProjects ? { projects: projects.map(({ dataValues: { name } }) => name) } : {}),
  }));
