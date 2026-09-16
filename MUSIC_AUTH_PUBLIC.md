# 跨网络网易云登录

当前版本已经把登录、账号同步和歌曲接口统一部署到 `ideal-machine-music-api`，不再需要 Tunnel。

只有需要临时把本机旧版登录服务暴露给外网时，才运行：

```bash
node start-public-music-auth.mjs
```

终端会输出一个“请在手机或其他网络打开”的 GitHub Pages 链接。该链接把本次临时 HTTPS 登录入口保存到浏览器，然后照常点击音乐 App 的“二维码登录”。

- 电脑可以继续通过 `http://localhost:3210/index.html` 使用本地登录服务。
- 手机和电脑不需要连接同一个 Wi-Fi。
- 运行命令的电脑必须保持开机，且终端不能关闭。
- 临时 Tunnel 每次重启后地址都会变化，需要重新打开终端输出的新链接。
- `.tools/cloudflared` 是本机工具，不会提交到 Git。

如需固定地址，应在 Cloudflare 中创建命名 Tunnel 和自定义域名，再把该 HTTPS 地址配置为 `neteaseAuthApiBase`。
