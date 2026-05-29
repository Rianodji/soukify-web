import type {
  RegisterPayload,
  RegisterResponse,
  SendOtpResponse,
  VerifyOtpPayload,
  VerifyOtpResponse,
} from "@/types/api";

export interface IAuthService {
  register(payload: RegisterPayload): Promise<RegisterResponse>;
  sendOtp(phoneNumber: string): Promise<SendOtpResponse>;
  verifyOtp(payload: VerifyOtpPayload): Promise<VerifyOtpResponse>;
  logout(): Promise<void>;
  refreshTokens(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }>;
}
