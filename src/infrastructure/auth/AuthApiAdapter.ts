import { ApiClient } from "@/infrastructure/http/ApiClient";
import type { IAuthService } from "@/application/auth/ports/IAuthService";
import type {
  RegisterPayload,
  RegisterResponse,
  SendOtpResponse,
  VerifyOtpPayload,
  VerifyOtpResponse,
} from "@/types/api";

export class AuthApiAdapter implements IAuthService {
  async register(payload: RegisterPayload): Promise<RegisterResponse> {
    return ApiClient.post<RegisterResponse>("/auth/register", payload);
  }

  async sendOtp(phoneNumber: string): Promise<SendOtpResponse> {
    return ApiClient.post<SendOtpResponse>("/auth/send-otp", { phoneNumber });
  }

  async verifyOtp(payload: VerifyOtpPayload): Promise<VerifyOtpResponse> {
    return ApiClient.post<VerifyOtpResponse>("/auth/verify-otp", payload);
  }

  async refreshTokens(refreshToken: string) {
    return ApiClient.post<{ accessToken: string; refreshToken: string }>("/auth/refresh", {
      refreshToken,
    });
  }

  async logout(): Promise<void> {
    await ApiClient.post("/auth/logout", {}, true).catch(() => {});
  }
}

export const authService = new AuthApiAdapter();
