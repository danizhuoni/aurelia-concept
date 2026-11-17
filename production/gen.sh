#!/usr/bin/env bash
# Usage: gen.sh <file-name> <model> <prompt-file> [extra higgsfield args...]
# Runs one Higgsfield generation, saves JSON log + downloaded result into production/raw/.
set -euo pipefail
cd "$(dirname "$0")"
name="$1"; model="$2"; promptfile="$3"; shift 3
mkdir -p raw logs
prompt="$(cat "$promptfile")"
higgsfield generate create "$model" --prompt "$prompt" "$@" --wait --wait-timeout 25m --json > "logs/$name.json" 2> "logs/$name.err"
url="$(python3 -c "import json,sys;d=json.load(open('logs/$name.json'));print(d[0]['result_url'] if isinstance(d,list) else d['result_url'])")"
ext="${url##*.}"
curl -sSL -o "raw/$name.$ext" "$url"
echo "$name -> raw/$name.$ext ($(du -h "raw/$name.$ext" | cut -f1))"
