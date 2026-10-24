// What TokensService issues; the controller splits it into body and cookie.
export interface IssuedTokens {
  accessToken: string;
  refreshToken: string;
  tokenType: "Bearer";
  expiresIn: number;
  refreshTokenExpiresAt: Date;
}
