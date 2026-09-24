export interface User {
  id: string;
  email: string;
  passwordHash: string;
  role: string;
  tenantId: string;
}

export class UserRepository {
  findByEmail(email: string): Promise<User | null> {
    return Promise.resolve(null);
  }
}
