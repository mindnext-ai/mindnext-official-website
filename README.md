# MindNext 官网

MindNext 官方网站（www.mindnext.cn）的静态站点源码：单文件 `index.html`
加上 `assets/` 静态资源，页面文案在运行时读取站点根目录的
`content.json`（由管理后台生成，不在本仓库内）。

> 仓库说明：本仓库经文本通道上传，图片类二进制资源（webp / png，
> 包括 `icon.webp` 与 `assets/` 下的预览图）未包含在内，完整资源以
> 线上站点为准。

## 部署

把 `index.html`、`license.js`、`license.json` 与 `assets/` 上传到站点
根目录即可。HTML 走协商缓存（no-cache + ETag），静态资源可配一年
immutable 强缓存。

## 软件授权（防盗用）

与校园二手交易平台同一套公开授权设计，针对纯静态站点实现：

- 站点根目录的 `license.json` 含授权对象、授权域名列表、签发日期与
  Ed25519 签名；当前授权域名为 `mindnext.cn` 与 `www.mindnext.cn`。
- `license.js` 内置公钥，页面加载时拉取 `license.json` 验签并核对
  当前域名：验签通过且域名命中才正常浏览；文件缺失、签名被篡改或
  域名不在列表内时，整页替换为未授权提示。本机 localhost 访问永远
  放行，方便本地预览。
- 验签库为 `assets/nacl-fast.min.js`（TweetNaCl，公共领域许可，
  许可文件见 `assets/NACL-LICENSE.txt`）。

### 重新签发

私钥存放在仓库之外的 `~/workspace/mindnext-license/license-private.pem`
（绝不入库）。签发工具：

```bash
node tools/sign-license.mjs keygen   # 首次生成密钥对
node tools/sign-license.mjs sign     # 签发 license.json 到站点根目录
```

更换授权域名时，改 `tools/sign-license.mjs` 里的 `DOMAINS` 后重新
签发，并同步更新 `license.js` 中的公钥（换密钥时）。

### 移除授权模块

删掉 `license.js`、`license.json`、`assets/nacl-fast.min.js`，并去掉
`index.html` 头部的两行 `<script>` 引用即可，站点恢复无校验状态。
