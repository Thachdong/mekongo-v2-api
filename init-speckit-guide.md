# MEKONGO API — Hướng dẫn khởi tạo backend NestJS

Nguồn sự thật cho contract: `../../openapi.yml` (v0.2.0). Backend implement đúng theo spec này —
Account vs Profile tách biệt, mọi resource (Post/Comment/ChatThread/Report) nested dưới Post,
realtime (chat + notification) qua WebSocket `/ws`.

## 1. Tech stack

| Layer | Choice | Lý do |
|---|---|---|
| Framework | NestJS 10 (Express platform) | DI mạnh, module hoá tốt, khớp Hexagonal |
| Language | TypeScript strict | đồng bộ với webapp |
| DB | PostgreSQL 16, chạy Docker | chuẩn, hỗ trợ JSON/Enum/FK tốt |
| ORM | Prisma | migration rõ ràng, type-safe client |
| Auth | Passport + `@nestjs/jwt` | Bearer access token + refresh token rotation |
| Realtime | `@nestjs/websockets` + socket.io adapter | khớp spec `/ws`, event `chat:message:new` / `notification:new` |
| Config | `@nestjs/config` + Joi validation, `registerAs` theo nhóm | fail-fast khi thiếu env, đọc config có type |
| API docs | `@nestjs/swagger` | serve tại `/docs`, đồng bộ tag với openapi.yml |
| Validation | `class-validator` + `class-transformer` | DTO tại boundary (HTTP inbound) |
| Test | Jest (unit domain/application) + Supertest (e2e infrastructure) | domain layer test không cần DB |

## 2. Kiến trúc: Hexagonal (Ports & Adapters)

Mỗi bounded context là 1 NestJS module, chia 3 lớp con:

```
domain/           — Entity, Value Object, business rule thuần. KHÔNG import Nest, Prisma, Express.
application/      — Use case (orchestrate domain qua port). Định nghĩa Port (interface) tại đây.
infrastructure/   — Adapter: implement port (Prisma repo), inbound adapter (HTTP controller, WS gateway).
```

Luật phụ thuộc: `infrastructure` → `application` → `domain`. Không chiều ngược lại.
`domain` không biết Prisma/Nest tồn tại — test domain logic bằng plain Jest, không cần Nest TestingModule.

Port ví dụ (`application/ports/account.repository.port.ts`):
```ts
export interface AccountRepositoryPort {
  findByIdentifier(identifier: string): Promise<Account | null>;
  save(account: Account): Promise<void>;
}
export const ACCOUNT_REPOSITORY = Symbol('ACCOUNT_REPOSITORY');
```

Adapter implement port (`infrastructure/persistence/prisma-account.repository.ts`):
```ts
@Injectable()
export class PrismaAccountRepository implements AccountRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}
  async findByIdentifier(identifier: string) {
    const row = await this.prisma.account.findFirst({ where: { OR: [{ phone: identifier }, { email: identifier }] } });
    return row ? AccountMapper.toDomain(row) : null;
  }
  async save(account: Account) { /* upsert */ }
}
```

Wire port → adapter trong module:
```ts
@Module({
  providers: [
    { provide: ACCOUNT_REPOSITORY, useClass: PrismaAccountRepository },
    RegisterAccountUseCase,
  ],
  controllers: [AuthController],
})
export class AuthModule {}
```

Use case chỉ phụ thuộc port, không phụ thuộc Prisma trực tiếp — đổi ORM sau này không đụng domain/application.

## 3. Cấu trúc thư mục

```
Implements/api/
  docker/
    docker-compose.yml
    .env.example
  prisma/
    schema.prisma
    migrations/
    seed.ts
  src/
    main.ts
    app.module.ts
    config/
      app.config.ts
      database.config.ts
      jwt.config.ts
      throttle.config.ts
      websocket.config.ts
      validation.schema.ts        # Joi, validate toàn bộ env 1 lần khi bootstrap
    shared/
      kernel/                     # Result<T,E>, DomainError base, base Entity/ValueObject
      infrastructure/
        prisma/                   # PrismaService, PrismaModule (global)
        websocket/                # EventBusService — publish domain event ra WS gateway
        filters/                  # GlobalExceptionFilter
        interceptors/             # LoggingInterceptor, TransformInterceptor
      guards/
        jwt-auth.guard.ts
        jwt-refresh.guard.ts
    modules/
      auth/                       # /auth/*  (register, otp, login, refresh, logout, password)
      account/                    # /account, /account/password/change, /account/profiles/*
      profile/                    # /profiles/{id}, /profiles/{id}/trust-score
      reference-data/             # /categories, /provinces
      uploads/                    # /uploads/presign
      posts/                      # /posts, /posts/{id}, like, save
      comments/                   # /posts/{postId}/comments (2-level thread)
      chat/                       # /posts/{postId}/chat-threads, /chat-threads, messages + WS gateway
      notifications/              # /notifications/* + WS gateway
      friends/                    # /friends, /friends/requests
      reports/                    # /posts/{postId}/reports
      trust-score/                # tính điểm, dùng chung bởi profile + reports
  test/
    e2e/
```

Mỗi module con lặp lại pattern `domain/ application/ infrastructure/` ở trên — module nhỏ (vd `reference-data`) có thể gộp bớt tầng nếu không có business rule (chỉ đọc bảng tĩnh), nhưng vẫn giữ port cho repository để dễ test.

## 4. Docker Compose — Postgres + pgAdmin

`docker/docker-compose.yml`:
```yaml
name: mekongo-api

services:
  postgres:
    image: postgres:16-alpine
    restart: unless-stopped
    environment:
      POSTGRES_USER: ${POSTGRES_USER:-mekongo}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-mekongo}
      POSTGRES_DB: ${POSTGRES_DB:-mekongo}
    ports:
      - '${POSTGRES_PORT:-5432}:5432'
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ['CMD-SHELL', 'pg_isready -U ${POSTGRES_USER:-mekongo}']
      interval: 5s
      timeout: 5s
      retries: 10

  pgadmin:
    image: dpage/pgadmin4:latest
    restart: unless-stopped
    environment:
      PGADMIN_DEFAULT_EMAIL: ${PGADMIN_EMAIL:-admin@mekongo.local}
      PGADMIN_DEFAULT_PASSWORD: ${PGADMIN_PASSWORD:-admin}
      PGADMIN_CONFIG_SERVER_MODE: 'False'
    ports:
      - '${PGADMIN_PORT:-5050}:80'
    volumes:
      - pgadmin_data:/var/lib/pgadmin
    depends_on:
      postgres:
        condition: service_healthy

volumes:
  postgres_data:
  pgadmin_data:
```

`docker/.env.example`:
```
POSTGRES_USER=mekongo
POSTGRES_PASSWORD=mekongo
POSTGRES_DB=mekongo
POSTGRES_PORT=5432
PGADMIN_EMAIL=admin@mekongo.local
PGADMIN_PASSWORD=admin
PGADMIN_PORT=5050
```

Chạy: `docker compose -f docker/docker-compose.yml --env-file docker/.env up -d`

Register server trong pgAdmin: host `postgres` (tên service, không phải `localhost` — pgAdmin container gọi qua network nội bộ), port `5432`, cùng user/password/db ở trên.

## 5. Prisma — schema + migration

`prisma/schema.prisma` (rút gọn, đủ entity chính theo openapi.yml — mở rộng field khi implement từng module):
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

enum ProfileType {
  INDIVIDUAL
}

model Account {
  id           String    @id @default(uuid())
  phone        String?   @unique
  email        String?   @unique
  passwordHash String
  status       String    @default("ACTIVE") // ACTIVE | BLOCKED | PENDING_VERIFICATION
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt
  profiles     Profile[]
  refreshTokens RefreshToken[]
}

model RefreshToken {
  id        String   @id @default(uuid())
  accountId String
  account   Account  @relation(fields: [accountId], references: [id], onDelete: Cascade)
  tokenHash String
  expiresAt DateTime
  revokedAt DateTime?
  createdAt DateTime @default(now())

  @@index([accountId])
}

model Profile {
  id         String      @id @default(uuid())
  accountId  String
  account    Account     @relation(fields: [accountId], references: [id], onDelete: Cascade)
  type       ProfileType @default(INDIVIDUAL)
  name       String
  avatarUrl  String?
  trustScore Int         @default(0)
  createdAt  DateTime    @default(now())
  updatedAt  DateTime    @updatedAt

  addresses  Address[]
  posts      Post[]
  comments   Comment[]

  @@unique([accountId, type])
}

model Address {
  id         String  @id @default(uuid())
  profileId  String
  profile    Profile @relation(fields: [profileId], references: [id], onDelete: Cascade)
  street     String
  ward       String
  district   String
  provinceId String
  isDefault  Boolean @default(false)
}

// Post / Comment / ChatThread / ChatMessage / Notification / FriendRequest / Report
// / Category / Province — thêm khi implement module tương ứng, theo đúng field trong openapi.yml.
```

Migration workflow (rõ ràng, không dùng `db push` cho môi trường có dữ liệu thật):
```bash
# 1. Sửa schema.prisma
# 2. Tạo migration + apply local
npx prisma migrate dev --name <mo_ta_ngan>

# 3. Sinh Prisma Client (tự chạy sau migrate dev, chạy tay khi cần)
npx prisma generate

# 4. Deploy migration production/staging (không tạo file mới, chỉ apply)
npx prisma migrate deploy

# 5. Seed dữ liệu mẫu (categories, provinces, demo account)
npx prisma db seed
```

`package.json` khai báo seed entrypoint:
```json
{ "prisma": { "seed": "ts-node prisma/seed.ts" } }
```

`PrismaService` (`shared/infrastructure/prisma/prisma.service.ts`) implement `OnModuleInit`/`OnModuleDestroy` để connect/disconnect đúng lifecycle Nest, export qua `PrismaModule` global (`@Global()`) — module con inject thẳng không cần import lại.

## 6. Config — validate + đăng ký theo nhóm

`config/validation.schema.ts` — 1 schema Joi validate toàn bộ `.env` khi bootstrap, fail-fast nếu thiếu/sai kiểu:
```ts
import * as Joi from 'joi';

export const validationSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'test', 'production').default('development'),
  PORT: Joi.number().default(3000),

  DATABASE_URL: Joi.string().uri().required(),

  JWT_ACCESS_SECRET: Joi.string().min(32).required(),
  JWT_ACCESS_EXPIRES_IN: Joi.string().default('15m'),
  JWT_REFRESH_SECRET: Joi.string().min(32).required(),
  JWT_REFRESH_EXPIRES_IN: Joi.string().default('30d'),

  CORS_ORIGIN: Joi.string().default('http://localhost:3300'),

  WS_PATH: Joi.string().default('/ws'),
});
```

Mỗi nhóm config 1 file dùng `registerAs` — type-safe, inject qua token riêng, không đọc `process.env` rải rác trong code:
```ts
// config/jwt.config.ts
export default registerAs('jwt', () => ({
  accessSecret: process.env.JWT_ACCESS_SECRET,
  accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN,
  refreshSecret: process.env.JWT_REFRESH_SECRET,
  refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN,
}));
```

Đăng ký ở `app.module.ts`:
```ts
ConfigModule.forRoot({
  isGlobal: true,
  validationSchema,
  load: [appConfig, databaseConfig, jwtConfig, throttleConfig, websocketConfig],
}),
```

Đọc config trong service qua `ConfigService.get<JwtConfig>('jwt')` — inject `ConfigType<typeof jwtConfig>` để có autocomplete, không hardcode string key rải rác.

## 7. Auth — Bearer access token + refresh token

Theo openapi.yml: `POST /auth/login` trả `TokenPair` (accessToken + refreshToken), `POST /auth/refresh` đổi refresh token lấy access token mới, `POST /auth/logout` revoke refresh token hiện tại.

- **Access token**: JWT ký `JWT_ACCESS_SECRET`, sống ngắn (15m mặc định), payload chứa `sub` (accountId) + `profileId` (JWT resolve thẳng ra profile duy nhất của account, theo đúng note trong openapi.yml — chưa có multi-profile switching).
- **Refresh token**: JWT random string, **không lưu plaintext** — hash (SHA-256 hoặc bcrypt) rồi lưu vào bảng `RefreshToken`, kèm `expiresAt`. Xác thực refresh = tìm theo hash + check `revokedAt IS NULL` + chưa hết hạn.
- **Rotation**: mỗi lần `/auth/refresh` thành công → revoke token cũ, phát hành cặp mới (chống replay nếu refresh token bị rò rỉ).
- **Logout / đổi mật khẩu**: revoke toàn bộ refresh token còn hiệu lực của account đó (khớp flow `/account/password/change` trong webapp — đổi mật khẩu xong tự logout).

2 Passport strategy:
```ts
// infrastructure/strategies/jwt-access.strategy.ts
@Injectable()
export class JwtAccessStrategy extends PassportStrategy(Strategy, 'jwt-access') {
  constructor(@Inject(jwtConfig.KEY) cfg: ConfigType<typeof jwtConfig>) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: cfg.accessSecret,
    });
  }
  async validate(payload: { sub: string; profileId: string }) {
    return { accountId: payload.sub, profileId: payload.profileId };
  }
}
```

`JwtAuthGuard extends AuthGuard('jwt-access')` — set `@UseGuards(JwtAuthGuard)` global qua `APP_GUARD`, mở public route bằng decorator `@Public()` (dùng `Reflector`) cho `login`, `register`, `otp/*`, `password/forgot`, `refresh` — khớp đúng những path có `security: []` trong openapi.yml.

## 8. WebSocket — chat + notification realtime

Openapi.yml quy định rõ: kênh `/ws`, server emit `chat:message:new` / `notification:new`, client emit `chat:message:send`. REST message-send endpoint chỉ là fallback.

```ts
@WebSocketGateway({ namespace: '/ws', cors: { origin: cfg.corsOrigin, credentials: true } })
export class RealtimeGateway implements OnGatewayConnection {
  @WebSocketServer() server: Server;

  constructor(private readonly jwtService: JwtService) {}

  async handleConnection(client: Socket) {
    const token = client.handshake.auth?.token as string | undefined;
    try {
      const payload = await this.jwtService.verifyAsync(token, { secret: this.accessSecret });
      client.data.profileId = payload.profileId;
      client.join(`profile:${payload.profileId}`); // room riêng cho mỗi profile
    } catch {
      client.disconnect();
    }
  }

  @SubscribeMessage('chat:message:send')
  async onSend(@ConnectedSocket() client: Socket, @MessageBody() dto: SendMessageDto) {
    const message = await this.sendMessageUseCase.execute(client.data.profileId, dto);
    this.server.to(`profile:${dto.recipientProfileId}`).emit('chat:message:new', message);
    return message; // ack về sender
  }
}
```

Use case (application layer, tách khỏi gateway) sau khi persist message xong publish qua `EventBusService` (shared/infrastructure/websocket) — để REST endpoint `POST .../messages` và WS `chat:message:send` dùng chung 1 use case, không lặp logic. Notification module publish `notification:new` cùng cơ chế khi có event tạo ra thông báo (like, comment, friend request...).

Adapter socket.io mặc định của Nest đã đủ dùng — chỉ cần cài `@nestjs/platform-socket.io` nếu muốn tách khỏi ws thuần.

## 9. Swagger

```ts
const config = new DocumentBuilder()
  .setTitle('MEKONGO API')
  .setVersion('0.2.0')
  .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'bearerAuth')
  .addTag('Auth').addTag('Account').addTag('Profile').addTag('Reference Data')
  .addTag('Uploads').addTag('Posts').addTag('Comments').addTag('Chat')
  .addTag('Notifications').addTag('Friends').addTag('Reports').addTag('TrustScore')
  .build();
const document = SwaggerModule.createDocument(app, config);
SwaggerModule.setup('docs', app, document);
```

Giữ đúng tag list và global prefix `/api/v1` (`app.setGlobalPrefix('api/v1')`) khớp `servers: - url: /api/v1` trong openapi.yml — Swagger UI sinh ra phải map 1-1 với contract, không lệch path.

## 10. `main.ts` — bootstrap tổng hợp

```ts
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api/v1');
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
  app.useGlobalFilters(new GlobalExceptionFilter());
  app.enableCors({ origin: process.env.CORS_ORIGIN, credentials: true });
  setupSwagger(app);
  await app.listen(process.env.PORT ?? 3000);
}
```

## 11. Thứ tự implement (khớp priority webapp đã build)

1. **Bootstrap hạ tầng**: docker compose lên, `prisma init`, config module, `PrismaModule`, Swagger, health check endpoint.
2. **Auth + Account + Profile** — register/otp/login/refresh/logout, đổi/quên mật khẩu, `/account/profiles/*`. Đây là nền, mọi module sau đều cần `JwtAuthGuard`.
3. **Reference Data + Uploads** — `/categories`, `/provinces` (đọc bảng tĩnh/seed), `/uploads/presign` (S3-compatible presigned URL, ví dụ MinIO local qua Docker nếu cần test).
4. **Posts + Comments** — CRUD post, like/save, comment 2 cấp (`parentCommentId`) đúng model webapp đã implement phía mock.
5. **Chat** — REST list thread/message + WS gateway `chat:message:new/send`.
6. **Notifications** — REST list/mark-read + WS gateway `notification:new`, bắn từ các module khác (like/comment/friend request) qua `EventBusService`.
7. **Friends** — request/accept/reject.
8. **Reports + TrustScore** — report post, tính trust score dựa trên hoạt động/report.

Mỗi bước: viết domain entity + use case trước (unit test không cần DB), rồi adapter Prisma, rồi controller/gateway, rồi so lại field-by-field với `openapi.yml` trước khi qua bước kế — tránh lệch contract mà webapp/MSW đã cố định.
