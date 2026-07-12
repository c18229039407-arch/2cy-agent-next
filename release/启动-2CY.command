#!/bin/bash
cd "$(dirname "$0")"

# 2CY: 首次启动自动解除 macOS 隔离标记。
# 本程序未购买 Apple 公证（$99/年），下载后会被系统标记为「来自互联网」而拒绝运行。
# 下面这行只是清除这个标记，等同于你在「系统设置 → 隐私与安全性」里点「仍要打开」。
# 程序完全在你本机运行，不联系任何服务器（你配置的模型 API 除外）。
if xattr -p com.apple.quarantine "./bin/2cy" >/dev/null 2>&1; then
  echo "首次启动：正在解除 macOS 的下载隔离标记…"
  xattr -dr com.apple.quarantine "./bin/2cy" 2>/dev/null
  xattr -dr com.apple.quarantine "$0" 2>/dev/null
fi

echo "正在启动 2CY Agent，浏览器将自动打开…"
echo "（关闭本窗口即可停止服务）"
echo ""
./bin/2cy web
