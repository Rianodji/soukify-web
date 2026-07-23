import { ApiClient } from "@/infrastructure/http/ApiClient";
import type { IAuthService } from "@/application/auth/ports/IAuthService";
import type {
  AuthTokens,
  ForgotPasswordPayload,
  LoginPayload,
  LoginResponse,
  RegisterPayload,
  RegisterResponse,
  ResetPasswordPayload,
} from "@/types/api";

export class AuthApiAdapter implements IAuthService {
  async login(payload: LoginPayload): Promise<LoginResponse> {
    return ApiClient.post<LoginResponse>("/auth/login", payload);
  }

  async register(payload: RegisterPayload): Promise<RegisterResponse> {
    return ApiClient.post<RegisterResponse>("/auth/register", payload);
  }

  async forgotPassword(payload: ForgotPasswordPayload): Promise<void> {
    await ApiClient.post("/auth/forgot-password", payload);
  }

  async resetPassword(payload: ResetPasswordPayload): Promise<void> {
    await ApiClient.post("/auth/reset-password", payload);
  }

  async refreshTokens(refreshToken: string): Promise<AuthTokens> {
    return ApiClient.post<AuthTokens>("/auth/refresh", { refreshToken });
  }

  async logout(refreshToken: string): Promise<void> {
    await ApiClient.post("/auth/logout", { refreshToken }, true).catch(() => {});
  }
}

export const authService = new AuthApiAdapter();
