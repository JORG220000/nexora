import { spawn } from "node:child_process";
import { existsSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { preview } from "vite";

const root = fileURLToPath(new URL("../", import.meta.url));
if (!existsSync(path.join(root, "dist/index.html"))) {
  console.error("Сначала выполните npm.cmd run build");
  process.exit(1);
}
const local = path.join(root, ".local");
mkdirSync(local, { recursive: true });
const server = await preview({
  root,
  configFile: false,
  preview: { host: "127.0.0.1", port: 4175, strictPort: true, allowedHosts: [] },
});
console.log("Подключаю временную ссылку через localhost.run…");
const ssh = spawn("ssh", [
  "-F", process.platform === "win32" ? "NUL" : "/dev/null",
  "-T", "-o", "ConnectTimeout=20",
  "-o", "ServerAliveInterval=30", "-o", "ServerAliveCountMax=3",
  "-o", "ExitOnForwardFailure=yes",
  "-o", "IdentityAgent=none", "-o", "IdentityFile=none",
  "-o", "StrictHostKeyChecking=accept-new",
  "-o", `UserKnownHostsFile=${path.join(local, "known_hosts")}`,
  "-R", "80:127.0.0.1:4175", "nokey@localhost.run",
  "--", "--output", "json",
], { stdio: ["ignore", "pipe", "pipe"], windowsHide: true });

let buffer = "";
let lastHost = "";
let stopping = false;
const timeout = setTimeout(() => {
  console.error("Туннель не подключился за 60 секунд. Проверьте сеть/VPN и повторите.");
  stop(1);
}, 60_000);

function consume(data) {
  buffer = (buffer + data.toString()).slice(-32_768);
  const matches = [...buffer.matchAll(/https:\/\/([a-z0-9-]+(?:\.app)?\.lhr\.life)\b/g)];
  const host = matches.at(-1)?.[1];
  if (!host || host === lastHost) return;
  lastHost = host;
  // Only the address assigned to this tunnel is permitted; no shared wildcard.
  server.config.preview.allowedHosts.splice(0, Infinity, host);
  clearTimeout(timeout);
  console.log(`\nNEXORA: https://${host}\nОтправьте эту ссылку. Оставьте окно открытым. Отключить: Ctrl+C.\n`);
}
ssh.stdout.on("data", consume);
ssh.stderr.on("data", (data) => {
  consume(data);
  const message = data.toString();
  if (/error|denied|failed|closed|timed out/i.test(message)) console.error(message.trim());
});
ssh.on("error", (error) => { console.error(error.message); stop(1); });
ssh.on("exit", (code) => {
  if (!stopping) console.error("Туннель закрыт. Для новой ссылки повторите npm.cmd run share.");
  stop(code ?? 1);
});
function stop(code = 0) {
  if (stopping) return;
  stopping = true;
  clearTimeout(timeout);
  ssh.kill();
  server.httpServer.closeAllConnections();
  server.httpServer.close(() => process.exit(code));
  setTimeout(() => process.exit(code), 1500).unref();
}
process.on("SIGINT", () => stop(0));
process.on("SIGTERM", () => stop(0));
