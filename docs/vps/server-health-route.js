/**
 * Rota de saúde do servidor para o painel admin do ChatFlex.
 *
 * INSTALAÇÃO NA VPS (backend em /home/deploy/notasflex/backend):
 * 1. Copie este arquivo para: src/routes/serverHealth.routes.js
 * 2. No arquivo onde as rotas são registradas (ex.: src/routes/index.js), adicione:
 *
 *      const serverHealthRoutes = require("./serverHealth.routes");
 *      router.use("/server", serverHealthRoutes);
 *
 *    Se o projeto usa import ES modules:
 *      import serverHealthRoutes from "./serverHealth.routes";
 *
 * 3. Ajuste o middleware de autenticação abaixo conforme o projeto
 *    (ex.: isAuth / ensureAdmin). A rota DEVE exigir admin.
 * 4. Reinicie: pm2 restart all
 *
 * Endpoint final: GET /server/health  (responde 401 sem token, 403 sem admin)
 */

const { Router } = require("express");
const os = require("os");
const { execFile } = require("child_process");

// TODO: ajustar para o middleware real do projeto:
// const isAuth = require("../middleware/isAuth");
// const isAdmin = require("../middleware/isAdmin");

const router = Router();

const run = (cmd, args) =>
  new Promise((resolve) => {
    execFile(cmd, args, { timeout: 5000 }, (err, stdout) => {
      resolve(err ? null : stdout);
    });
  });

async function getDisk() {
  const out = await run("df", ["-k", "/"]);
  if (!out) return null;
  const line = out.trim().split("\n").pop();
  const parts = line.trim().split(/\s+/);
  // Filesystem 1K-blocks Used Available Use% Mounted
  const totalKB = Number(parts[1]);
  const usedKB = Number(parts[2]);
  if (!totalKB) return null;
  return {
    totalGB: Math.round((totalKB / 1048576) * 10) / 10,
    usedGB: Math.round((usedKB / 1048576) * 10) / 10,
    percent: Math.round((usedKB / totalKB) * 1000) / 10,
  };
}

async function getPm2() {
  const out = await run("pm2", ["jlist"]);
  if (!out) return null;
  try {
    const list = JSON.parse(out);
    return list.map((p) => ({
      name: p.name,
      status: p.pm2_env?.status ?? "unknown",
      restarts: p.pm2_env?.restart_time ?? 0,
      memoryMB: Math.round((p.monit?.memory ?? 0) / 1048576),
      cpuPercent: p.monit?.cpu ?? 0,
      uptimeSeconds: p.pm2_env?.pm_uptime
        ? Math.round((Date.now() - p.pm2_env.pm_uptime) / 1000)
        : null,
    }));
  } catch {
    return null;
  }
}

function getCpu() {
  const load = os.loadavg()[0];
  const cores = os.cpus().length;
  return {
    cores,
    loadAvg1m: Math.round(load * 100) / 100,
    percent: Math.round(Math.min(100, (load / cores) * 1000)) / 10,
  };
}

function getMemory() {
  const total = os.totalmem();
  const free = os.freemem();
  const used = total - free;
  return {
    totalMB: Math.round(total / 1048576),
    usedMB: Math.round(used / 1048576),
    percent: Math.round((used / total) * 1000) / 10,
  };
}

// Proteger com autenticação + admin antes de publicar:
// router.get("/health", isAuth, isAdmin, async (_req, res) => {
router.get("/health", async (_req, res) => {
  const [disk, pm2] = await Promise.all([getDisk(), getPm2()]);
  res.json({
    hostname: os.hostname(),
    uptimeSeconds: Math.round(os.uptime()),
    cpu: getCpu(),
    memory: getMemory(),
    disk,
    pm2,
    collectedAt: new Date().toISOString(),
  });
});

module.exports = router;
