import { Result } from "@/domain/shared/Result";

/* Chad phone: +235 followed by 8 digits */
const CHAD_PHONE_REGEX = /^\+235[0-9]{8}$/;
const LOCAL_PHONE_REGEX = /^[0-9]{8}$/;

export class PhoneNumber {
  private constructor(private readonly _value: string) {}

  static create(raw: string): Result<PhoneNumber> {
    const normalized = PhoneNumber.normalize(raw);
    if (!CHAD_PHONE_REGEX.test(normalized)) {
      return Result.err("Numéro invalide. Format attendu : 8 chiffres (ex: 66 XX XX XX)");
    }
    return Result.ok(new PhoneNumber(normalized));
  }

  static normalize(raw: string): string {
    const digits = raw.replace(/[\s\-().]/g, "");
    if (LOCAL_PHONE_REGEX.test(digits)) return `+235${digits}`;
    if (digits.startsWith("00235")) return `+${digits.slice(2)}`;
    return digits.startsWith("+") ? digits : `+${digits}`;
  }

  get value(): string {
    return this._value;
  }

  equals(other: PhoneNumber): boolean {
    return this._value === other._value;
  }
}
