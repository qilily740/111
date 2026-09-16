# 理想机音乐登录 Worker

这是音乐 App 的独立网易云网页登录扫码后端，只负责二维码登录和退出登录。二维码使用网易云当前网页扫码入口 `/st/platform/scanlogin`，并保留网页 Cookie、设备标识和扫码链路 ID。

账号资料、歌单、歌曲搜索、歌词和播放地址仍由 `cloudflare/music-worker` 处理，本 Worker 不包含任何同步接口，也不读写音乐数据。

## 部署

先在本目录配置登录会话签名密钥，然后部署：

```sh
cd cloudflare/music-auth-worker
npx wrangler secret put AUTH_TOKEN_SECRET
npx wrangler deploy
```

`AUTH_TOKEN_SECRET` 只用于签名二维码临时会话，不要写入 `wrangler.jsonc` 或提交到仓库。

本地开发也可以直接运行仓库根目录的独立登录服务，不需要 Cloudflare 登录：

```sh
node music-auth-server.mjs
```

本地网页会自动连接 `http://127.0.0.1:3211/api`；生产网页仍连接已部署的 Worker。

手机访问理想机时，不能使用 `127.0.0.1`：它指向手机自己，而不是你的电脑。请先把本 Worker 部署成功，再用下面的地址确认公网登录服务已经生效：

```sh
curl https://ideal-machine-music-auth.ideal-machine.workers.dev/api/auth/qr/key
```

手机端打开理想机后会自动使用这个公网 HTTPS 地址。若仍看到旧的“切换其他登录方式”提示，请关闭理想机页面后重新打开，或清除浏览器站点缓存，让新版 `apps/yinyue.js` 生效。

如需使用其他网页域名，把它加入 `wrangler.jsonc` 的 `ALLOWED_ORIGIN`，多个域名用逗号分隔。

## 接口

- `GET /api/auth/qr/key`
- `GET /api/auth/qr/create?key=...&qrSessionToken=...`
- `GET /api/auth/qr/image?key=...&qrSessionToken=...`
- `GET /api/auth/qr/check?key=...&qrSessionToken=...`
- `POST /api/auth/logout`

扫码成功后返回的 `sessionToken` 保持音乐 Worker 现有的兼容格式，因此无需迁移或修改账号、歌单和歌曲同步逻辑。
