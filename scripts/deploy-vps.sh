#!/usr/bin/env bash
# Executado apenas pela automação SSH, nunca pelo servidor web.
set -euo pipefail
APP_DIR=${APP_DIR:-/var/www/chatflex-frontend}
PROCESS_NAME=${PROCESS_NAME:-chatflex-frontend}
HEALTH_URL=${HEALTH_URL:-http://localhost:3001}
: "${RELEASE_ID:?Release ID obrigatório}"
: "${RELEASE_SHA:?Commit obrigatório}"
[[ "$RELEASE_ID" =~ ^[0-9]+-[0-9]+$ ]]
[[ "$RELEASE_SHA" =~ ^[a-f0-9]{40}$ ]]
INCOMING="$APP_DIR/deploy-incoming/$RELEASE_ID"
RELEASE="$APP_DIR/releases/$RELEASE_ID"
PREVIOUS="$APP_DIR/releases/previous-$RELEASE_ID"
OUTPUT="$APP_DIR/.output"

command -v node >/dev/null
command -v pm2 >/dev/null
# O pacote é compilado em Linux x64 com Node 22.
node -e 'const [major,minor]=process.versions.node.split(".").map(Number);if(process.platform!=="linux"||process.arch!=="x64"||major!==22||minor<12){console.error("VPS requer Linux x64 e Node 22.12 ou superior da série 22.");process.exit(1)}'
pm2 jlist | PROCESS_NAME="$PROCESS_NAME" EXPECTED_ENTRY="$OUTPUT/server/index.mjs" node -e '
let data="";process.stdin.on("data",c=>data+=c);process.stdin.on("end",()=>{
const app=JSON.parse(data).find(p=>p.name===process.env.PROCESS_NAME);
if(!app || app.pm2_env?.pm_exec_path!==process.env.EXPECTED_ENTRY){console.error("PM2 deve apontar para .output/server/index.mjs da aplicação antes desta migração.");process.exit(1)}
});'
test -e "$OUTPUT"
test ! -e "$RELEASE"
test ! -e "$PREVIOUS"
(cd "$INCOMING" && sha256sum -c release.tar.gz.sha256)
mkdir -p "$RELEASE"
tar -xzf "$INCOMING/release.tar.gz" -C "$RELEASE"
test -s "$RELEASE/.output/server/index.mjs"
test -d "$RELEASE/node_modules"
RELEASE_SHA="$RELEASE_SHA" node -e 'const v=JSON.parse(require("fs").readFileSync(process.argv[1]));if(v.commit!==process.env.RELEASE_SHA)process.exit(1)' "$RELEASE/.output/public/deploy-version.json"

switched=false
restore_previous() {
  local result=$?
  trap - EXIT
  if [[ "$result" -ne 0 && "$switched" == true ]]; then
    echo 'Falha na atualização; restaurando a versão anterior.' >&2
    rm -f "$OUTPUT"
    mv "$PREVIOUS" "$OUTPUT"
    pm2 reload "$PROCESS_NAME" || echo 'Restauração dos arquivos concluída, mas PM2 requer atenção.' >&2
  fi
  exit "$result"
}
trap restore_previous EXIT
mv "$OUTPUT" "$PREVIOUS"
switched=true
ln -s "$RELEASE/.output" "$OUTPUT"
pm2 reload "$PROCESS_NAME"
for attempt in $(seq 1 15); do
  if curl -fsS --max-time 5 "$HEALTH_URL/" -o /dev/null &&
     curl -fsS --max-time 5 "$HEALTH_URL/deploy-version.json?commit=$RELEASE_SHA" -o "$INCOMING/version-check.json" &&
     RELEASE_SHA="$RELEASE_SHA" node -e 'const v=JSON.parse(require("fs").readFileSync(process.argv[1]));process.exit(v.commit===process.env.RELEASE_SHA?0:1)' "$INCOMING/version-check.json"; then
    echo "Deploy OK: $RELEASE_SHA; versão anterior preservada em $PREVIOUS"
    exit 0
  fi
  sleep 2
done
echo 'A nova versão não respondeu corretamente na porta local.' >&2
exit 1