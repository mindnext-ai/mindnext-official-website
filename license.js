/*
 * MindNext 官网软件授权校验（公开模块，设计与原理全部写在本文件里）
 *
 * 原理：站点根目录放一份 license.json，内含授权对象、授权域名列表、
 * 签发日期与 Ed25519 签名。本脚本内置公钥，页面加载时拉取
 * license.json 验签，并核对当前域名是否在授权列表内：
 *   - 验签通过且域名命中 → 正常浏览；
 *   - 授权文件缺失、签名被篡改、或域名不在列表内 → 整页替换为
 *     未授权提示（等同于后端站点的 403）；
 *   - localhost / 127.0.0.1 / ::1 本机访问永远放行，方便本地预览。
 *
 * 签名串格式：licensee + "\n" + 排序后的域名（逗号连接） + "\n" + issued_at
 * 签发工具：tools/sign-license.mjs（私钥存放在仓库之外）。
 * 验签库：assets/nacl-fast.min.js（TweetNaCl，公共领域许可，
 * 许可文件见 assets/NACL-LICENSE.txt）。
 */
(function () {
  'use strict';
  var PUBLIC_KEY_B64 = 't8h55CaGEHHWxu57yvB4FLV8iv0NyEW0uSHMtBBx4KY=';

  var host = (location.hostname || '').toLowerCase();
  if (host === 'localhost' || host === '127.0.0.1' || host === '::1' || host === '') {
    return; // 本机预览永远放行
  }

  function b64ToBytes(b64) {
    var bin = atob(b64);
    var out = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
  }

  function canonical(lic) {
    var domains = (lic.domains || []).slice().sort();
    return lic.licensee + '\n' + domains.join(',') + '\n' + lic.issued_at;
  }

  function block(reason) {
    var html =
      '<!doctype html><html lang="zh-CN"><head><meta charset="utf-8">' +
      '<meta name="viewport" content="width=device-width, initial-scale=1">' +
      '<title>软件未授权</title></head>' +
      '<body style="margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;' +
      'background:#0b1526;color:#e8edf0;font-family:-apple-system,\'PingFang SC\',\'Microsoft YaHei\',sans-serif;">' +
      '<div style="max-width:420px;padding:32px;text-align:center;">' +
      '<div style="font-size:44px;font-weight:800;letter-spacing:2px;">403</div>' +
      '<p style="font-size:17px;line-height:1.7;margin:16px 0 8px;">软件未授权，或当前域名不在授权范围内</p>' +
      '<p style="font-size:13px;color:#8a97a5;line-height:1.7;margin:0;">' + reason + '</p>' +
      '</div></body></html>';
    document.open();
    document.write(html);
    document.close();
  }

  function check(lic) {
    if (!lic || typeof lic !== 'object' || !lic.signature) {
      block('未找到有效的授权文件。');
      return;
    }
    var domains = (lic.domains || []).map(function (d) {
      return String(d).toLowerCase();
    });
    if (domains.indexOf(host) === -1) {
      block('域名 ' + host + ' 不在授权范围内。');
      return;
    }
    if (!window.nacl || !window.nacl.sign || !window.nacl.sign.detached) {
      block('授权校验组件加载失败。');
      return;
    }
    var msg = new TextEncoder().encode(canonical(lic));
    var ok = false;
    try {
      ok = window.nacl.sign.detached.verify(
        msg,
        b64ToBytes(lic.signature),
        b64ToBytes(PUBLIC_KEY_B64)
      );
    } catch (e) {
      ok = false;
    }
    if (!ok) {
      block('授权文件签名校验未通过。');
    }
    // 验签通过且域名命中：什么都不做，页面照常浏览。
  }

  fetch('/license.json', { cache: 'no-store' })
    .then(function (r) {
      if (!r.ok) throw new Error('license.json ' + r.status);
      return r.json();
    })
    .then(check)
    .catch(function () {
      block('未找到有效的授权文件。');
    });
})();
