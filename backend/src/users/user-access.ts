import { User } from "./entities/user.entity.js";
import { UserStatus } from "./enums/user-status.enum.js";

// The one rule for "may this user use the app": checked on login, refresh,
// profile and password change, so a pending, rejected or disabled user can
// never get or keep a session.
export function canSignIn(user: Pick<User, "isActive" | "status">) {
  return user.isActive && user.status === UserStatus.Active;
}
