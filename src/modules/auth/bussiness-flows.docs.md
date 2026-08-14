# Auth — Business Flows

## Flow: Register

**API 1 — `POST /auth/register`** (`RegisterAccountUseCase`)
- Input: `{ loginType, identifier, password, profileType?, address }`
- Entity liên quan: tạo `Account` (status = `PENDING_VERIFICATION`) + `Profile` (mặc định `type=INDIVIDUAL`) + `Address` (mặc định) trong 1 transaction atomic (`RegisterAccountTransactionPort`); sau đó gọi nội bộ `RequestOtpUseCase` để tạo `OtpRequest` (purpose = `REGISTER`) và gửi OTP.
- Output: `{ accountId, profileId, otpRequestId }`

**API 2 — `POST /auth/otp/verify`** (`VerifyOtpUseCase`)
- Input: `{ otpRequestId, code }`
- Entity liên quan: verify code trên `OtpRequest` (so hash, check hết hạn/blocked) rồi `consume()`; vì `purpose = REGISTER` → `Account.activate()` (`PENDING_VERIFICATION` → `ACTIVE`).
- Output: `{ resetToken? }` — rỗng với purpose `REGISTER` (chỉ có giá trị cho `RESET_PASSWORD`).

> Sau bước này account đã `ACTIVE`, client gọi `POST /auth/login` (flow riêng, ngoài phạm vi doc này) để lấy access/refresh token.

---

## Flow: Reset password (quên mật khẩu — chưa đăng nhập)

**API 1 — `POST /auth/password/forgot`** (`ForgotPasswordUseCase`)
- Input: `{ loginType, identifier }`
- Entity liên quan: tìm `Account` theo `identifier` (không tồn tại vẫn trả `otpRequestId` giả — tránh account enumeration); nếu tồn tại, gọi `RequestOtpUseCase` tạo `OtpRequest` (purpose = `RESET_PASSWORD`) và gửi OTP.
- Output: `{ otpRequestId }`

**API 2 — `POST /auth/otp/verify`** (`VerifyOtpUseCase`)
- Input: `{ otpRequestId, code }`
- Entity liên quan: verify + `consume()` `OtpRequest`; vì `purpose = RESET_PASSWORD` → sinh `resetToken` (random opaque token), hash + gắn TTL riêng vào `OtpRequest.attachResetToken()`.
- Output: `{ resetToken }`

**API 3 — `POST /auth/password/reset`** (`ResetPasswordUseCase`)
- Input: `{ resetToken, newPassword }`
- Entity liên quan: hash `resetToken` → tìm `OtpRequest` theo hash, check `purpose = RESET_PASSWORD` + chưa hết hạn (`matchesResetToken()`) → lấy `accountId` từ đó → load `Account`, `changePassword()` + save; `OtpRequest.invalidateResetToken()` (chống replay); `RefreshToken.revokeAllForAccount()` (đăng xuất toàn bộ session cũ).
- Output: `200`, không body — client phải đăng nhập lại.

---

## Flow: Change password (đang đăng nhập)

Không cần OTP — chỉ cần `oldPassword` đúng là đổi được ngay, 1 API duy nhất.

**API 1 — `POST /account/password/change`** (`ChangePasswordUseCase`, yêu cầu JWT — `accountId` lấy từ access token, không từ body)
- Input: `{ oldPassword, newPassword }`
- Entity liên quan: load `Account` theo `accountId` (JWT); so `oldPassword` với hash hiện tại trên `Account` (`WrongOldPasswordError` nếu sai); `Account.changePassword()` + save; `RefreshToken.revokeAllForAccount()` (đăng xuất toàn bộ session, kể cả session hiện tại).
- Output: `200`, không body — client phải đăng nhập lại.
