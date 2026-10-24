// Where a user is in the join flow. Only active users can log in.
export enum UserStatus {
  // Signed up to join an existing company; waiting for one of its admins.
  Pending = "pending",
  Active = "active",
  // Declined by an admin. Kept, so the email can't re-apply, and so an
  // admin can still approve it later.
  Rejected = "rejected",
}
