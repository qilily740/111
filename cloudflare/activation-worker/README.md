# 理想机自动激活 Worker

这个 Worker 提供激活网站和自动发码接口。用户在理想机获取设备码后，打开 Worker 首页，输入设备码即可自动获得激活码；理想机再调用验证接口完成解锁。

## 创建 D1

```sh
cd cloudflare/activation-worker
npx wrangler d1 create ideal-machine-activation
```

把命令返回的 `database_id` 填入 `wrangler.jsonc` 的 `d1_databases[0].database_id`。

初始化数据库：

```sh
npx wrangler d1 execute ideal-machine-activation --remote --file=schema.sql
```

本地测试可以把 `--remote` 改成 `--local`。

## 本地运行

```sh
npx wrangler dev
```

打开终端显示的地址即可看到激活网站。

## 部署

```sh
npx wrangler deploy
```

当前已部署的激活网站：`https://ideal-machine-activation.ideal-machine.workers.dev`

部署后的首页就是激活网站，用户输入设备码后会自动得到激活码。

## 接入理想机

理想机内置激活验证地址，不需要用户在设置中填写地址。激活网站由你通过激活引导卡或其他官方渠道提供。

这个 Worker 不保存角色卡内容，只保存设备码哈希、激活码哈希和激活状态。当前激活权限为 `st_character_card_import`。
