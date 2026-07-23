import type {
  AuthTokens,
  ForgotPasswordPayload,
  LoginPayload,
  LoginResponse,
  RegisterPayload,
  RegisterResponse,
  ResetPasswordPayload,
} from "@/types/api";

export interface IAuthService {
  login(payload: LoginPayload): Promise<LoginResponse>;
  register(payload: RegisterPayload): Promise<RegisterResponse>;
  forgotPassword(payload: ForgotPasswordPayload): Promise<void>;
  resetPassword(payload: ResetPasswordPayload): Promise<void>;
  logout(refreshToken: string): Promise<void>;
  refreshTokens(refreshToken: string): Promise<AuthTokens>;
}
