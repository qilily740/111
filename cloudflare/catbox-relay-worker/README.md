# 理想机免费图床中转 Worker

这个 Worker 不使用 R2。它接收理想机相册的图片，再转发到 ImgDB，最后把 ImgDB 返回的公开图片 URL 返回给相册，用来解决浏览器直接调用第三方图床时可能出现的跨域问题。

## 部署

```sh
cd cloudflare/catbox-relay-worker
npx wrangler deploy
```

部署后会得到一个 `https://ideal-machine-catbox-relay.<你的子域>.workers.dev` 地址。将 `wrangler.jsonc` 的 `ALLOWED_ORIGINS` 改成理想机网页的实际地址后重新部署；本地测试可保留 `http://localhost:8787`。

## 接口

- `GET /health`：健康检查。
- `POST /images`：发送原始图片二进制，返回 `{ "url": "https://imgdb.io/i/..." }`，最大 12 MB。

图片会公开存放在 ImgDB，不要上传私人照片。免费第三方服务不适合保存重要资料或唯一备份。
