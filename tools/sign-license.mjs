// MindNext 官网授权签发工具（Ed25519）
//
// 用法：
//   node tools/sign-license.mjs keygen
//       在 ~/workspace/mindnext-license/ 生成密钥对（已存在则拒绝覆盖）。
//   node tools/sign-license.mjs sign [输出文件]
//       用私钥签发 license.json（默认写到网站根目录 license.json）。
//
// 私钥只存放在仓库外的 ~/workspace/mindnext-license/license-private.pem，
// 绝不提交进仓库。签名串格式与校验端 license.js 保持一致：
//   licensee + "\n" + 排序后的域名（逗号连接） + "\n" + issued_at
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const KEY_DIR = path.join(os.homedir(), 'workspace', 'mindnext-license');
const PRIV_PATH = path.join(KEY_DIR, 'license-private.pem');
const PUB_PATH = path.join(KEY_DIR, 'license-public.txt');
const SITE_ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

const LICENSEE = 'LittleTech';
const DOMAINS = ['mindnext.cn', 'www.mindnext.cn'];
const ISSUED_AT = '2026-11-23';

function canonical(licensee, domains, issuedAt) {
  return licensee + '\n' + [...domains].sort().join(',') + '\n' + issuedAt;
}

const cmd = process.argv[2];
if (cmd === 'keygen') {
  if (fs.existsSync(PRIV_PATH)) {
    console.error('私钥已存在，拒绝覆盖：' + PRIV_PATH);
    process.exit(1);
  }
  fs.mkdirSync(KEY_DIR, { recursive: true, mode: 0o700 });
  const { publicKey, privateKey } = crypto.generateKeyPairSync('ed25519');
  const pem = privateKey.export({ type: 'pkcs8', format: 'pem' });
  fs.writeFileSync(PRIV_PATH, pem, { mode: 0o600 });
  const jwk = publicKey.export({ format: 'jwk' });
  const pubB64 = Buffer.from(jwk.x, 'base64url').toString('base64');
  fs.writeFileSync(PUB_PATH, pubB64 + '\n', { mode: 0o644 });
  console.log('公钥（base64）: ' + pubB64);
  console.log('私钥已保存: ' + PRIV_PATH);
} else if (cmd === 'sign') {
  const privPem = fs.readFileSync(PRIV_PATH, 'utf8');
  const privateKey = crypto.createPrivateKey(privPem);
  const msg = Buffer.from(canonical(LICENSEE, DOMAINS, ISSUED_AT), 'utf8');
  const signature = crypto.sign(null, msg, privateKey).toString('base64');
  const license = {
    licensee: LICENSEE,
    domains: [...DOMAINS].sort(),
    issued_at: ISSUED_AT,
    signature
  };
  const out = process.argv[3] || path.join(SITE_ROOT, 'license.json');
  fs.writeFileSync(out, JSON.stringify(license, null, 2) + '\n');
  console.log('已签发: ' + out);
  console.log(JSON.stringify(license, null, 2));
} else {
  console.error('用法: node tools/sign-license.mjs keygen | sign [输出文件]');
  process.exit(1);
}
