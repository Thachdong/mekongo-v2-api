# Task Plan — Feature: Authentication (`/auth/*`)

Nguồn: `../../openapi.yml` (tag `Auth`, 8 endpoint) + `init-speckit-guide.md`.
Kiến trúc: Hexagonal — `domain/ → application/ → infrastructure/`, module `src/modules/auth`.

## 0. Điều kiện tiên quyết (infra còn thiếu, phải làm trước)

Hiện `src/app.module.ts` mới có `ConfigModule` + `AuthModule` rỗng. Thiếu:

- [ ] `src/shared/infrastructure/prisma/prisma.service.ts` — implement `OnModuleInit`/`OnModuleDestroy`,
      dùng `@prisma/adapter-pg` (schema generator là `prisma-client` mới, không phải `prisma-client-js`
      → phải khởi tạo `PrismaClient` qua driver adapter `PrismaPg`, connection string lấy từ
      `databaseConfig.url`).
- [ ] `src/shared/infrastructure/prisma/prisma.module.ts` — `@Global()`, export `PrismaService`.
- [ ] `src/shared/kernel/` — `Result<T,E>` hoặc dùng exception thuần (chọn 1, xem mục 7), base
      `DomainError`.
- [ ] `src/shared/infrastructure/filters/global-exception.filter.ts` — map DomainError → HTTP status
      đúng `Error` schema (`code`, `message`).
- [ ] `main.ts`: `setGlobalPrefix('api/v1')`, `ValidationPipe({whitelist:true, forbidNonWhitelisted:true,
      transform:true})`, `useGlobalFilters(new GlobalExceptionFilter())`, Swagger setup tại `/docs`.
- [ ] Import `PrismaModule` vào `AppModule`.

Không làm hết 0 thì use case Auth không chạy được — làm trước, tối thiểu đủ cho Auth (Swagger/health
check có thể làm song song, không blocking).

## 1. Cài thêm package

```bash
npm i @nestjs/jwt @nestjs/passport passport passport-jwt bcrypt @nestjs/throttler @nestjs/swagger class-validator class-transformer
npm i -D @types/passport-jwt @types/bcrypt
```

- `@nestjs/jwt` + `passport-jwt`: access token strategy.
- `bcrypt`: hash password + hash OTP code + hash refresh token + hash reset token.
- `@nestjs/throttler`: rate-limit OTP resend/wrong-attempt tại tầng HTTP (bổ sung, KHÔNG thay logic
  đếm attempt trong domain — 2 lớp phòng thủ khác nhau).
- refresh token / reset token / OTP code sinh bằng `crypto.randomBytes` (Node built-in), không cần lib
  thêm.

## 2. Prisma schema — bổ sung

`account.prisma`, `refresh_token.prisma`, `profile.prisma` đã có sẵn, đủ dùng. Cần thêm 1 model mới
cho OTP — `prisma/models/otp_request.prisma`:

```prisma
enum EOtpPurpose {
  REGISTER
  RESET_PASSWORD
  CHANGE_PASSWORD
}

model OtpRequest {
  id                String       @id @default(uuid())
  purpose           EOtpPurpose
  accountId         String?
  identifier        String?      // phone/email snapshot — cần cho reset_password khi chưa có accountId lúc request
  codeHash          String
  wrongAttempts     Int          @default(0)
  resendAttempts    Int          @default(0)
  consumedAt        DateTime?
  blockedUntil      DateTime?
  expiresAt         DateTime
  resetTokenHash    String?      // set sau khi verify đúng OTP (purpose reset_password/change_password)
  resetTokenExpiresAt DateTime?
  createdAt         DateTime     @default(now())

  @@index([accountId])
  @@index([identifier])
}
```

Lý do gộp reset-token vào cùng row OtpRequest thay vì bảng riêng: 1 vòng đời duy nhất
(request → verify → dùng reset token 1 lần), tránh đồng bộ 2 bảng.

Chạy: `npx prisma migrate dev --name add_otp_request` sau khi sửa schema.

## 3. Config bổ sung

`src/configs/otp.config.ts`:

```ts
export const otpConfig = registerAs('otp', () => ({
  codeLength: 6,
  ttlMinutes: 5,
  maxResendAttempts: 5,
  resendBlockHours: 5,
  maxWrongAttempts: 5,
  wrongBlockHours: 5,
  resetTokenTtlMinutes: 10,
}));
```

Thêm export vào `src/configs/index.ts`, thêm vào `load: [...]` trong `AppModule`. Không cần Joi bắt
buộc (có default), có thể thêm optional vào `validation.schema.ts` nếu muốn override qua env.

`jwt.config.ts` đã đủ (`JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET` — refresh secret thực ra không dùng
để ký JWT nữa vì refresh token là random string hash, không phải JWT — xem mục 7.5, có thể bỏ field
`refreshSecret`/`refreshExpiresIn` khỏi jwt.config và thay bằng `refreshExpiresIn` dùng để tính
`expiresAt` khi lưu DB — giữ tên field, chỉ đổi cách dùng).

## 4. Cấu trúc thư mục `src/modules/auth/`

```
auth/
  domain/
    account.entity.ts            # Account: id, phone?, email?, passwordHash, status
    otp-request.entity.ts        # OtpRequest: business rule verify/increment attempt/block
    value-objects/
      identifier.vo.ts           # validate phone/email theo loginType
      password.vo.ts             # rule minLength 8 (đã có ở DTO, nhưng domain giữ invariant)
    errors/
      auth-domain.errors.ts      # InvalidCredentialsError, AccountInactiveError, OtpExpiredError,
                                  # OtpWrongCodeError, OtpBlockedError, IdentifierTakenError, ...
  application/
    ports/
      account.repository.port.ts
      otp-request.repository.port.ts
      refresh-token.repository.port.ts
      profile.repository.port.ts      # chỉ cần create() cho register — đủ, KHÔNG cần full port
      password-hasher.port.ts
      token.service.port.ts           # sign access token, generate+hash refresh token
      otp-sender.port.ts               # send(identifier, loginType, code) — SMS/email
    use-cases/
      register-account.use-case.ts
      request-otp.use-case.ts
      verify-otp.use-case.ts
      login.use-case.ts
      refresh-token.use-case.ts
      logout.use-case.ts
      forgot-password.use-case.ts
      reset-password.use-case.ts
    dto/                              # input/output types thuần (không phải class-validator DTO)
      token-pair.result.ts
  infrastructure/
    persistence/
      prisma-account.repository.ts
      prisma-otp-request.repository.ts
      prisma-refresh-token.repository.ts
      prisma-profile.repository.ts
      account.mapper.ts
    security/
      bcrypt-password-hasher.ts
      jwt-token.service.ts
      jwt-access.strategy.ts
      jwt-auth.guard.ts
      public.decorator.ts
    otp/
      console-otp-sender.ts           # stub adapter: log ra console (dev) — thay bằng SMS/email provider sau
    http/
      auth.controller.ts
      dto/
        register.dto.ts
        request-otp.dto.ts
        verify-otp.dto.ts
        login.dto.ts
        refresh-token.dto.ts
        forgot-password.dto.ts
        reset-password.dto.ts
  auth.module.ts
```

## 5. Domain layer — chi tiết

- `Account` entity: field `status: 'ACTIVE' | 'BLOCKED' | 'PENDING_VERIFICATION'`. Method
  `activate()` (PENDING_VERIFICATION → ACTIVE, throw nếu không đúng state), `isLoginAllowed()`.
- `OtpRequest` entity: encapsulate toàn bộ rule đếm attempt/block — **không** để use case tự cộng số,
  gọi `otpRequest.registerResendAttempt()` / `otpRequest.verifyCode(inputHash, hasher)` /
  `otpRequest.isBlocked()` / `otpRequest.isExpired()`. Đây là nơi rule "max 5 lần, block 5 giờ" sống —
  domain thuần, test bằng Jest không cần DB.
- Không import Nest/Prisma/Express ở toàn bộ `domain/`.

## 6. Application layer — use case (logic từng cái)

1. **RegisterAccountUseCase**
   - Check `identifier` chưa tồn tại (theo `loginType`) → nếu có, throw `IdentifierTakenError` (409).
   - Hash password, tạo `Account(status=PENDING_VERIFICATION)` + `Profile(type=profileType ??
     INDIVIDUAL)` + `Address` (từ `AddressInput`) — **trong 1 transaction Prisma**
     (`prisma.$transaction`).
   - Gọi `RequestOtpUseCase.execute({purpose: REGISTER, accountId})` nội bộ (không qua HTTP) để sinh
     OTP.
   - Trả `{accountId, profileId, otpRequestId}`.

2. **RequestOtpUseCase**
   - Input: `{purpose, accountId?, identifier?}`.
   - Nếu có OtpRequest active gần nhất cùng `accountId`+`purpose` (hoặc `identifier`+`purpose` khi
     chưa có account) và `blockedUntil > now` → throw `OtpResendBlockedError` (429, kèm `retryAfter`).
   - Tính `resendAttempts` — nếu vượt `maxResendAttempts` → set `blockedUntil = now +
     resendBlockHours`, throw 429.
   - Sinh code 6 số random, hash (bcrypt), lưu `OtpRequest` mới với `expiresAt = now + ttlMinutes`.
   - Gọi `OtpSenderPort.send(identifier, loginType, code)` — plaintext code CHỈ tồn tại trong tham số
     này, không log ra ngoài production.
   - Trả `{otpRequestId, expiresAt, resendAttemptsRemaining}`.

3. **VerifyOtpUseCase**
   - Load `OtpRequest` theo id — không tồn tại/đã consumed/hết hạn → lỗi tương ứng.
   - `isBlocked()` → 429 kèm `retryAfter`.
   - So khớp `code` với `codeHash` — sai → tăng `wrongAttempts`, nếu chạm `maxWrongAttempts` set
     `blockedUntil`, throw 400 kèm `wrongAttemptsRemaining`.
   - Đúng → `consumedAt = now`.
     - `purpose = REGISTER`: `AccountRepository.activate(accountId)`.
     - `purpose ∈ {RESET_PASSWORD, CHANGE_PASSWORD}`: sinh `resetToken` random (32 byte hex), hash lưu
       vào `resetTokenHash`/`resetTokenExpiresAt` (= now + `resetTokenTtlMinutes`), trả plaintext
       token 1 lần trong response.
   - Trả `{resetToken?}`.

4. **LoginUseCase**
   - Tìm `Account` theo `identifier` (match đúng field phone/email theo `loginType`, KHÔNG OR cả 2 —
     khác với ví dụ `findByIdentifier` OR trong guide, vì spec bắt `loginType` tường minh).
   - `status !== ACTIVE` → 401 (không phân biệt lý do, tránh lộ thông tin).
   - So bcrypt password — sai → 401.
   - Load `Profile` duy nhất của account (theo `@@unique([accountId, type])`, hiện chỉ 1).
   - `TokenService.signAccessToken({sub: accountId, profileId})` + `TokenService.issueRefreshToken()`
     (random string, hash lưu `RefreshToken` row với `expiresAt`).
   - Trả `TokenPair`.

5. **RefreshTokenUseCase**
   - Hash `refreshToken` đầu vào, tìm `RefreshToken` theo hash — không tồn tại / `revokedAt != null` /
     hết hạn → 401.
   - Revoke row cũ (`revokedAt = now`) — **rotation**, phát row mới + access token mới.
   - Load lại `Profile` để gắn `profileId` vào access token mới (phòng trường hợp đổi profile trong
     tương lai).

6. **LogoutUseCase**
   - Endpoint yêu cầu Bearer (không có `security: []` trong spec) — `accountId` lấy từ access token đã
     xác thực qua guard.
   - **Giả định cần chốt với FE** (spec không show request body rõ): nhận `refreshToken` optional
     trong body — có thì chỉ revoke đúng token đó; không có thì revoke toàn bộ refresh token còn hiệu
     lực của account (logout "tất cả thiết bị"). Ghi rõ giả định này trong Swagger description.

7. **ForgotPasswordUseCase**
   - Tìm account theo `identifier`+`loginType`. **Không tồn tại vẫn trả 200 với `otpRequestId` giả**
     (tránh account enumeration) — nhưng KHÔNG tạo `OtpSenderPort.send` thật. Nếu tồn tại, gọi
     `RequestOtpUseCase({purpose: RESET_PASSWORD, accountId, identifier})`.

8. **ResetPasswordUseCase**
   - Hash `resetToken` đầu vào, tìm `OtpRequest` có `resetTokenHash` khớp, `purpose=RESET_PASSWORD`,
     chưa dùng lại (thêm cờ `resetTokenUsedAt` hoặc tái dùng `consumedAt` — dùng field riêng để tránh
     đụng logic OTP-verify), chưa hết `resetTokenExpiresAt`.
   - Update `Account.passwordHash`, **revoke toàn bộ RefreshToken** của account (đăng xuất mọi phiên).

> `POST /account/password/change` (tag Account, không phải Auth) dùng lại `PasswordHasherPort` +
> `RefreshTokenRepositoryPort` + `OtpRequest` (purpose=CHANGE_PASSWORD) nhưng thuộc `modules/account`
> — **ngoài phạm vi plan này**, làm ở bước kế theo guide mục 11.2. Ghi chú để không quên: cần export
> lại các port trên từ `auth` module hoặc đặt `PasswordHasherPort`/`TokenService` vào `shared/` nếu
> `account` module cần dùng chung (tránh vòng phụ thuộc `account → auth`).

## 7. Infrastructure layer — chi tiết

- **`BcryptPasswordHasher`**: `hash(plain)`, `compare(plain, hash)` — cost factor 10-12, đọc từ config
  nếu cần tune.
- **`JwtTokenService`**: dùng `JwtService` (`@nestjs/jwt`) ký access token
  `{sub: accountId, profileId}`, `expiresIn = jwtConfig.accessExpiresIn`. Refresh token: KHÔNG ký JWT
  — `crypto.randomBytes(32).toString('hex')`, hash bằng bcrypt hoặc sha256 (sha256 đủ vì không cần
  salt cho random-32-byte, và cần verify nhanh — chọn sha256, ghi rõ trong code vì khác bcrypt dùng
  cho password/OTP).
- **`JwtAccessStrategy`** (`PassportStrategy(Strategy, 'jwt-access')`): `secretOrKey =
  jwtConfig.accessSecret`, `validate()` trả `{accountId, profileId}` → gắn vào `request.user`.
- **`JwtAuthGuard extends AuthGuard('jwt-access')`**: đăng ký global qua `APP_GUARD` trong
  `AuthModule` (hoặc `AppModule` — đặt ở `AppModule` vì áp dụng toàn hệ thống, không riêng auth).
- **`@Public()` decorator** (`SetMetadata('isPublic', true)`) + check trong `JwtAuthGuard.canActivate`
  qua `Reflector` — áp cho: `register`, `otp/request`, `otp/verve`, `login`, `refresh`,
  `password/forgot`, `password/reset` (đúng 7 route có `security: []`; `logout` KHÔNG public).
- **Prisma repository adapters**: implement đúng port interface, KHÔNG leak Prisma type ra khỏi
  `infrastructure/` (map sang domain entity qua `*.mapper.ts`).
- **`ConsoleOtpSender`**: `console.log('[OTP]', identifier, code)` — placeholder, thay bằng SMS/email
  provider thật sau (Twilio/SES...), đã tách port nên đổi không đụng use case.
- **`AuthController`**: 8 route đúng path/method openapi, DTO validate bằng `class-validator`
  (`@IsEnum(LoginType)`, `@MinLength(8)`, `@Matches(/^[0-9]{6}$/)` cho OTP code...), Swagger decorator
  (`@ApiTags('Auth')`, `@ApiOperation`, `@ApiResponse`) khớp field response trong spec.

## 8. Wiring `auth.module.ts`

```ts
@Module({
  imports: [JwtModule.registerAsync({ useFactory: ... }), PassportModule],
  controllers: [AuthController],
  providers: [
    { provide: ACCOUNT_REPOSITORY, useClass: PrismaAccountRepository },
    { provide: OTP_REQUEST_REPOSITORY, useClass: PrismaOtpRequestRepository },
    { provide: REFRESH_TOKEN_REPOSITORY, useClass: PrismaRefreshTokenRepository },
    { provide: PROFILE_REPOSITORY, useClass: PrismaProfileRepository },
    { provide: PASSWORD_HASHER, useClass: BcryptPasswordHasher },
    { provide: TOKEN_SERVICE, useClass: JwtTokenService },
    { provide: OTP_SENDER, useClass: ConsoleOtpSender },
    JwtAccessStrategy,
    RegisterAccountUseCase, RequestOtpUseCase, VerifyOtpUseCase,
    LoginUseCase, RefreshTokenUseCase, LogoutUseCase,
    ForgotPasswordUseCase, ResetPasswordUseCase,
  ],
  exports: [PASSWORD_HASHER, TOKEN_SERVICE, REFRESH_TOKEN_REPOSITORY], // account module cần dùng lại
})
export class AuthModule {}
```

`APP_GUARD` (JwtAuthGuard) đăng ký ở `AppModule`, không ở `AuthModule` — global thật sự.

## 9. Test

- Unit (Jest, không DB): `otp-request.entity.spec.ts` (rule block/attempt), mỗi use case mock port
  qua interface (`jest.fn()` implement port) — test `LoginUseCase`, `VerifyOtpUseCase` kỹ nhất (nhiều
  nhánh lỗi).
- E2E (Supertest, cần DB test — dùng `docker compose` Postgres riêng hoặc schema test):
  `test/e2e/auth.e2e-spec.ts` — full flow: register → verify OTP → login → refresh (rotation, token cũ
  bị revoke) → logout → refresh bằng token cũ phải 401.

## 10. Checklist thứ tự code

- [ ] 0. PrismaService/PrismaModule + GlobalExceptionFilter + main.ts bootstrap
- [ ] 1. Cài package (mục 1)
- [ ] 2. Thêm `otp_request.prisma` + migrate
- [ ] 3. `otp.config.ts` + đăng ký vào `AppModule`
- [ ] 4. Domain: `Account`, `OtpRequest` entity + errors — viết test trước (TDD nhẹ cho rule OTP)
- [ ] 5. Application: port interfaces → use case (theo thứ tự: Register → RequestOtp → VerifyOtp →
      Login → Refresh → Logout → ForgotPassword → ResetPassword, vì use case sau tái dùng use case
      trước)
- [ ] 6. Infrastructure: mapper + Prisma repo → security (hasher/token service/strategy/guard) → OTP
      sender stub
- [ ] 7. HTTP: DTO + controller + Swagger decorator
- [ ] 8. Wire `auth.module.ts`, `APP_GUARD` ở `AppModule`
- [ ] 9. Test unit + e2e
- [ ] 10. So field-by-field response mỗi endpoint với `openapi.yml` trước khi coi module xong

## 11. Việc cần hỏi lại / giả định (đánh dấu rõ khi code xong, xác nhận với FE/PM)

1. `POST /auth/logout` — spec không show request body → giả định optional `refreshToken` trong body
   (mục 6.6). Nếu FE luôn gửi refreshToken thì bắt buộc field này, bỏ nhánh "revoke toàn bộ".
2. `POST /auth/password/forgot` khi identifier không tồn tại — giả định vẫn trả 200 (chống
   enumeration), không gửi OTP thật.
3. OTP delivery thật (SMS/email provider) chưa xác định nhà cung cấp — hiện dùng `ConsoleOtpSender`
   stub, cắm provider thật sau khi có quyết định (Twilio/ESMS/SES...).
4. `refreshSecret`/`refreshExpiresIn` trong `jwt.config.ts` đổi ý nghĩa: không dùng để ký JWT, chỉ dùng
   `refreshExpiresIn` để tính TTL lưu DB — nếu team muốn refresh token vẫn là JWT (thay vì random+hash)
   thì đổi lại `JwtTokenService`, ảnh hưởng cách verify ở `RefreshTokenUseCase`.
