#!/usr/bin/env bash
set -euo pipefail

if [[ $# -ne 1 ]]; then
  echo "Usage: $0 /absolute/path/to/alerts.json" >&2
  exit 64
fi

source_json=$1
script_dir=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)
repo_root=$(cd -- "$script_dir/.." && pwd)
destination="$repo_root/log/alerts.json"

if [[ ! -f "$source_json" ]]; then
  echo "Source is not a regular file: $source_json" >&2
  exit 66
fi

if [[ -n "$(git -C "$repo_root" status --porcelain)" ]]; then
  echo "Refusing to publish from a dirty checkout." >&2
  exit 65
fi

git -C "$repo_root" pull --ff-only origin main
node "$script_dir/validate-public-log.cjs" "$source_json"
install -m 0644 "$source_json" "$destination"
node "$script_dir/validate-public-log.cjs" "$destination"

if git -C "$repo_root" diff --quiet -- log/alerts.json; then
  echo "Public log is already current."
  exit 0
fi

git -C "$repo_root" add -- log/alerts.json
git -C "$repo_root" diff --cached --check
git -C "$repo_root" commit -m "data: publish verified public log"
git -C "$repo_root" push origin main
