#!/bin/zsh
cd -- "${0:A:h}" || exit 1
if ! command -v node >/dev/null 2>&1; then
  echo '需要先安装 Node.js 22 或更新版本。'
  read '?按回车关闭…'
  exit 1
fi
node server/local-api-server.mjs
read '?按回车关闭…'
