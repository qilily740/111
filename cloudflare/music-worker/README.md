# 理想机音乐 Cloudflare Worker

这个 Worker 是音乐 App 的安全接口层。它不保存网易云账号密码，只转发二维码登录状态、登录会话和个人资料请求，并把上游的登录 Cookie 传回浏览器。

## 配置

先进入本目录：

```sh
cd cloudflare/music-worker
```

设置上游授权服务地址。不要把密钥写入代码：

```sh
npx wrangler secret put UPSTREAM_BASE_URL
```

`UPSTREAM_BASE_URL` 应该是你有权使用的音乐服务接口根地址。然后把 `wrangler.jsonc` 中的 `ALLOWED_ORIGIN` 改成实际网页地址；本地测试可保留 `http://localhost:8787`。

部署：

```sh
npx wrangler deploy
```

部署后，在网页初始化前设置：

```js
window.IdealMachineConfig = {
  neteaseApiBase: 'https://你的-worker-域名.workers.dev/api',
  imageApiBase: 'https://你的-worker-域名.workers.dev',
  imageUploadToken: '仅供你自己的理想机使用的上传口令'
};
```

## 相册图床（公开 http(s) 图片 URL）

这个 Worker 还提供相册图床：上传成功后会返回 `https://你的-worker/images/...`。相册里删除图片只会删除相册记录，不会删除 R2 中的对象，因此已经复制、贴到其他 App 的 URL 仍然可以继续显示。

部署前先创建 R2 bucket（配置文件使用的名称为 `ideal-machine-images`）：

```sh
npx wrangler r2 bucket create ideal-machine-images
```

然后设置一个上传口令，并把实际网页地址写入 `ALLOWED_ORIGIN`。口令必须同时填写到网页的 `window.IdealMachineConfig.imageUploadToken`；这是个人使用的基础保护。若网页会公开给其他人使用，应改用 Cloudflare Access 等真实登录保护，不能把长期口令公开在页面里。

```sh
npx wrangler secret put IMAGE_UPLOAD_TOKEN
```

图床接口：

- `POST /images`：上传图片，需 `Authorization: Bearer <IMAGE_UPLOAD_TOKEN>`，最大 12 MB。
- `GET /images/album/...`：直接返回可嵌入的公开图片。
- `HEAD /images/album/...`：读取图片元信息。

可以选配 `PUBLIC_IMAGE_BASE_URL` 变量为图片域名；未配置时 URL 会使用 Worker 自身的 `workers.dev` 域名。

## 已开放的接口

- `/api/auth/qr/key`
- `/api/auth/qr/create`
- `/api/auth/qr/check`
- `/api/user/profile`
- `/api/user/account`
- `/api/user/playlist`
- `/api/user/vip`
- `/api/search`
- `/api/lyric?id=歌曲 ID`
- `/api/song/:id/url`

接口采用白名单，其他路径不会被转发。完整播放仍必须由上游服务按账号权限返回，Worker 不会绕过 VIP 或版权限制。
