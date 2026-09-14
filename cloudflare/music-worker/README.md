# 理想机音乐 Cloudflare Worker

这个 Worker 是音乐 App 的安全接口层。它不保存网易云账号密码，直接调用网易云接口处理二维码登录状态、登录会话、搜索、歌词和个人资料请求；登录会话只以短期令牌形式返回给浏览器。

## 配置

先进入本目录：

```sh
cd cloudflare/music-worker
```

不需要配置网易云 API 密钥。把 `wrangler.jsonc` 中的 `ALLOWED_ORIGIN` 改成实际网页地址；本地测试可保留 `http://localhost:8787`。

部署：

```sh
npx wrangler deploy
```

部署后，在网页初始化前设置（如果使用本项目默认域名，可以不设置 `neteaseApiBase`）：

```js
window.IdealMachineConfig = {
  neteaseApiBase: 'https://你的-worker-域名.workers.dev/api',
  imageApiBase: 'https://你的-worker-域名.workers.dev',
  imageUploadToken: '仅供你自己的理想机使用的上传口令'
};
```

相册图片目前由独立的 Catbox 中转 Worker 提供，不依赖这个音乐 Worker 或 R2。

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
