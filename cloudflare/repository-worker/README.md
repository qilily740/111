# 理想机仓库后端

独立 Cloudflare Worker。D1 保存帖子、点赞、收藏和文件索引，Google Drive 保存附件与帖子头像快照；所有接口使用现有理想机账号令牌，经 `ideal-machine-auth` 服务验证。个人主页头像只保存在当前设备的浏览器存储，不同步到后端；发帖时压缩上传一份快照，旧帖头像不会随个人头像修改。仓库不提供帖子回复。

文件内容存放在授权 Google 账号的私有 Drive 中，Worker 只使用 `drive.file` 最小范围，并通过 OAuth refresh token 访问。首次成功发帖时会在 Drive 根目录创建“个人文件同步”文件夹；也可以通过 `GOOGLE_DRIVE_FOLDER_ID` 指定已有的应用文件夹。

生图跨域兜底使用已登录理想机账号授权的 `POST /api/image-proxy`。前端仅在生图 API 直连两次均未收到 HTTP 响应时调用；明确的 API HTTP 错误（如 400/401/429）不会转代理。Worker 仅允许 HTTPS 的 `/images/generations` 目标并限制请求体大小，不记录或保存 API Key、提示词及响应，亦不写入 D1；转发时 API Key 和提示词会经过 Cloudflare Worker。该代理兼容 OpenAI 风格生图端点，不会自动转换各家不同的 API 协议。

部署前设置以下 Worker Secret：`GOOGLE_CLIENT_ID`、`GOOGLE_CLIENT_SECRET`、`GOOGLE_REFRESH_TOKEN`。不要把客户端密钥或 refresh token 写入仓库、前端代码或普通环境变量。

OAuth 客户端 JSON 不需要提交到仓库。下载桌面客户端 JSON 后，在本目录运行 `node scripts/google-drive-auth.mjs /绝对路径/client_secret.json`，按终端提示在浏览器完成一次授权；脚本会把三个 Secret 直接写入当前 Worker，不会把密钥写入文件。

部署前用 `npx wrangler login` 登录 Cloudflare。在本目录配置 D1 ID 后执行 `npx wrangler d1 migrations apply ideal-machine-repository --remote` 和 `npx wrangler deploy`。在前端配置 `window.IdealMachineConfig.repositoryApiBase` 为部署后的 Worker 地址。未部署前频道为空，不再显示示例帖；上传与收藏会提示服务尚未配置，本机头像仍可更换。

美化频道每帖至少提供一个现有的 `IDEAL-...` 美化码，或一个可导入的 `.css` / `.json` 文件；世界书需 `.docx`、`.txt` 或 `.json` 主文件；角色卡需 `.png`、`.docx`、`.txt` 或 `.json` 主文件。其他支持的图片可以作为预览附件。每帖最多 3 个附件、单文件最多 8 MiB、请求最多 26 MiB。附件只通过带账号令牌的接口提供；代码类文件作为下载发送，不会在仓库页面执行。用户需先点赞才能查看或保存美化码、下载附件，以及将帖子导入对应 App。保存帖子会先导入，再写入个人主页收藏。

## 个人资料（2026-10-08）

个人页使用 `GET/POST /api/me/profile` 保存昵称、自我介绍与仅本人可读的备注；写入仅允许 nickname、bio、note，不接受账号或注册日期。注册日期通过 auth-worker 的 publicUser.createdAt 返回。点赞记录通过 `GET /api/me/likes?offset=0` 分页读取，每页 30 条。好友目前仅有入口与未开放状态，尚未实现搜索、申请或关系管理。

上线顺序：先对 repository D1 应用 `0003_personal_profile.sql` 迁移，部署 auth-worker 和 repository-worker，最后发布前端。否则资料与点赞接口不可用，页面会提示失败，不会伪造注册时间或保存成功。头像沿用原有本机保存逻辑。此次代码修改未执行线上部署。

回归：`node --test test/profile.test.mjs`（Node 22.13+，使用内存 SQLite，覆盖账号隔离、资料写入白名单、注册日期与点赞分页）。


## 好友

左侧第一个入口是好友页。好友通过固定 Ideal ID（账号名）精确搜索；auth-worker 的 `GET /auth/users/search?q=` 只返回匹配账号的内部 ID 和 Ideal ID；好友关系及待处理申请保存在 repository D1。部署前先应用 `0004_friends.sql`，然后部署 auth-worker、repository-worker，最后发布前端。申请支持接受、拒绝、撤回和移除好友。
