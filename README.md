# MindNext 官网

MindNext 官方网站（www.mindnext.cn）的静态站点源码：单文件 `index.html`
加上 `assets/` 静态资源，页面文案在运行时读取站点根目录的
`content.json`（由管理后台生成，不在本仓库内）。

> 仓库说明：本仓库经文本通道上传，图片类二进制资源（webp / png，
> 包括 `icon.webp` 与 `assets/` 下的预览图）未包含在内，完整资源以
> 线上站点为准。

## 部署

把 `index.html` 与 `assets/` 上传到站点根目录即可。HTML 走协商缓存
（no-cache + ETag），静态资源可配一年 immutable 强缓存。
