# 理想机账号认证 Worker

该 Worker 使用 Better Auth 与 Cloudflare D1 保存用户名密码认证、Session、注册流程票据及 Discord 持续资格缓存。公开自助注册路由默认拒绝；账号只能经 Worker 的 Discord 资格、QQ 邮箱验证和一次性注册票据流程创建。

## Cloudflare 资源

创建专用 D1，不复用激活或推送数据库：

```sh
npx wrangler d1 create ideal-machine-auth
```

将创建结果中的 database ID 填入 `wrangler.jsonc`，再应用 migration：

```sh
npx wrangler d1 migrations apply ideal-machine-auth --remote
```

## Worker Secrets

通过 Wrangler Secret 或 Cloudflare Dashboard 添加以下值，不要放进 `wrangler.jsonc`、前端或 Git：

- `BETTER_AUTH_SECRET`：至少 32 字节的随机值。
- `DISCORD_CLIENT_ID`
- `DISCORD_CLIENT_SECRET`
- `DISCORD_TOKEN_ENCRYPTION_KEY`：至少 32 字节的随机密钥，用于 AES-GCM 加密存于 D1 的 Discord OAuth 访问令牌和刷新令牌。
- `QQ_SMTP_USER`
- `QQ_SMTP_AUTH_CODE`
- 可选 `QQ_SMTP_FROM`（默认使用 `QQ_SMTP_USER`）。

此方案不需要 Bot，也不需要把 Bot 邀请进目标社区。注册时会请求 Discord `identify` 和 `guilds.members.read` OAuth 范围，用户授权后，Worker 用用户自己的访问令牌读取其社区成员资料并比对角色。`DISCORD_GUILD_ROLE_REQUIREMENTS` 使用 JSON 数组配置社区与允许身份组的配对；满足任意一组配对即可通过，身份组不会跨社区匹配。OAuth redirect URL、前端地址和 Worker 地址也配置在 `wrangler.jsonc` 的非敏感变量中。

QQ 邮箱验证码通过 `smtp.qq.com:465` TLS 发送。Worker 使用 Nodemailer SMTP transport；首次部署应先验证 QQ 邮箱已开启 SMTP 并使用授权码，而不是 QQ 登录密码。

## 部署顺序

1. 创建专用 D1、填入 `database_id` 并应用 migration。
2. 将 `AUTH_BASE_URL` 与 `DISCORD_REDIRECT_URI` 替换成此 Worker 的实际 HTTPS 地址；在 Discord Developer Portal 中将同一 callback URL 加入 OAuth2 redirect 列表。
3. 设置 Worker Secrets，再部署此 Worker。
4. 在其余五个 Worker 建立到 `ideal-machine-auth` 的 Service Binding 并重新部署；部署名必须保持一致。
5. 将主站 `index.html` 的 `authApiBase` 更新成 Auth Worker 实际地址。
6. 注册一个测试账号，确认退出、重新登录、撤销 Discord 身份组后授权失效，再上线。

建议先用 `wrangler secret put` 逐项写入 Secrets：

```sh
npx wrangler secret put BETTER_AUTH_SECRET
npx wrangler secret put DISCORD_CLIENT_ID
npx wrangler secret put DISCORD_CLIENT_SECRET
npx wrangler secret put DISCORD_TOKEN_ENCRYPTION_KEY
npx wrangler secret put QQ_SMTP_USER
npx wrangler secret put QQ_SMTP_AUTH_CODE
```

## 当前接口

- `GET /health`
- `GET /auth/discord/start`
- `GET /auth/discord/callback`
- `POST /auth/email/send`
- `POST /auth/email/verify`
- `POST /auth/register`
- `POST /auth/login`
- `GET /auth/session`
- `POST /auth/authorize`
- Better Auth 的 `/api/auth/*` 路由（注册、改名、改密和邮箱登录路由关闭）。

`/auth/authorize` 供其他 Worker 校验 Bearer Session 与 Discord 当前资格。激活、图床、音乐、音乐登录和推送的受保护接口都已调用该检查。D1 中的 Discord 资格缓存最长 10 分钟；Discord API 检查失败时采用失败关闭策略。OAuth 访问令牌和刷新令牌使用 `DISCORD_TOKEN_ENCRYPTION_KEY` 加密后才写入 D1。

## 本地开发

复制 `.dev.vars.example` 到 `.dev.vars`，仅填入本机开发 Secret，再运行：

```sh
npm install
npm run dev
```

远端 D1、Discord OAuth 应用和 QQ SMTP 尚需各自配置。Discord OAuth 不需要创建或安装 Bot。不要使用生产 Secret 进行本地测试。

部署前运行 API 授权边界测试：

```sh
npm test
```

用 `npm run check` 可在本地打包 Auth Worker 并检查 Wrangler 绑定配置，不会发布 Worker。
