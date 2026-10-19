// @vitest-environment node
import { execFileSync, spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, realpathSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";

function fixture(failHealth = false) {
  const root = mkdtempSync(join(tmpdir(), "chatflex-deploy-"));
  const app = join(root, "app");
  const incoming = join(app, "deploy-incoming/12-1");
  const stage = join(root, "stage");
  const bin = join(root, "bin");
  const sha = "a".repeat(40);
  for (const dir of [incoming, bin, join(app, ".output/server"), join(stage, ".output/server"), join(stage, ".output/public"), join(stage, "node_modules")]) mkdirSync(dir, { recursive: true });
  writeFileSync(join(app, ".output/server/index.mjs"), "previous");
  writeFileSync(join(stage, ".output/server/index.mjs"), "new");
  writeFileSync(join(stage, ".output/public/deploy-version.json"), JSON.stringify({ commit: sha }));
  writeFileSync(join(stage, "package.json"), '{"type":"module"}');
  execFileSync("tar", ["-czf", join(incoming, "release.tar.gz"), ".output", "node_modules", "package.json"], { cwd: stage });
  writeFileSync(join(incoming, "release.tar.gz.sha256"), execFileSync("sha256sum", ["release.tar.gz"], { cwd: incoming }));
  const executable = (name: string, script: string) => writeFileSync(join(bin, name), `#!/bin/bash\n${script}\n`, { mode: 0o755 });
  executable("node", `if [[ "$2" == *'process.versions.node.split'* ]]; then exit 0; fi\nexec '${process.execPath}' "$@"`);
  executable("pm2", `if [[ "$1" == jlist ]]; then printf '%s' '${JSON.stringify([{ name: "chatflex-frontend", pm2_env: { pm_exec_path: join(app, ".output/server/index.mjs") } }])}'; else echo reload >> '${join(root, "reloads")}'; fi`);
  executable("curl", failHealth ? "exit 22" : `output=''\nwhile [[ $# -gt 0 ]]; do if [[ "$1" == '-o' ]]; then output="$2"; shift; fi; shift; done\nif [[ "$output" != /dev/null ]]; then printf '%s' '{"commit":"${sha}"}' > "$output"; fi`);
  executable("sleep", "exit 0");
  return { root, app, sha, env: { ...process.env, PATH: `${bin}:${process.env.PATH}`, APP_DIR: app, RELEASE_ID: "12-1", RELEASE_SHA: sha } };
}

describe("deploy VPS com pacote compilado", () => {
  it("ativa a versão enviada e preserva a anterior sem compilar na VPS", () => {
    const f = fixture();
    try {
      const result = spawnSync("bash", [resolve("scripts/deploy-vps.sh")], { env: f.env, encoding: "utf8" });
      expect(result.status, result.stderr).toBe(0);
      expect(realpathSync(join(f.app, ".output"))).toBe(join(f.app, "releases/12-1/.output"));
      expect(readFileSync(join(f.app, "releases/previous-12-1/server/index.mjs"), "utf8")).toBe("previous");
      expect(readFileSync(join(f.app, ".output/public/deploy-version.json"), "utf8")).toBe(JSON.stringify({ commit: f.sha }));
    } finally { rmSync(f.root, { recursive: true, force: true }); }
  });

  it("restaura arquivos e recarrega a versão anterior quando a verificação falha", () => {
    const f = fixture(true);
    try {
      const result = spawnSync("bash", [resolve("scripts/deploy-vps.sh")], { env: f.env, encoding: "utf8" });
      expect(result.status).toBe(1);
      expect(readFileSync(join(f.app, ".output/server/index.mjs"), "utf8")).toBe("previous");
      expect(readFileSync(join(f.root, "reloads"), "utf8").trim().split("\n")).toHaveLength(2);
    } finally { rmSync(f.root, { recursive: true, force: true }); }
  });

  it("recusa pacote com checksum adulterado antes de alterar a versão ativa", () => {
    const f = fixture();
    try {
      writeFileSync(join(f.app, "deploy-incoming/12-1/release.tar.gz.sha256"), `${"0".repeat(64)}  release.tar.gz\n`);
      const result = spawnSync("bash", [resolve("scripts/deploy-vps.sh")], { env: f.env, encoding: "utf8" });
      expect(result.status).not.toBe(0);
      expect(readFileSync(join(f.app, ".output/server/index.mjs"), "utf8")).toBe("previous");
    } finally { rmSync(f.root, { recursive: true, force: true }); }
  });
});