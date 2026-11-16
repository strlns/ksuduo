#!/usr/bin/env bash
# Build the checked-out commit, stage the complete site, then replace the live copy.
set -euo pipefail

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$script_dir"

fail() {
  printf 'Deploy aborted: %s\n' "$*" >&2
  exit 1
}

for command in git npm ssh scp ssh-add; do
  command -v "$command" >/dev/null 2>&1 || fail "Required command not found: $command"
done

revision="$(git rev-parse HEAD)"
[[ -z "${KSUDUO_DEPLOY_COMMIT:-}" || "$KSUDUO_DEPLOY_COMMIT" = "$revision" ]] ||
  fail "The pushed commit is not the checked-out HEAD. Check it out before deploying."
[[ -z "$(git status --porcelain)" ]] || fail "Commit or stash changes before deploying."

remote="netcup"
remote_root="/paperclip-factory.de/httpdocs"
release="$(date -u +%Y%m%dT%H%M%SZ)-${revision:0:12}"
staging="_ksuduo-$release"
ssh_options=(-o BatchMode=yes -o ConnectTimeout=10 -o StrictHostKeyChecking=yes)

npm run build
[[ -s dist/index.html && -d dist/assets && -s dist/manifest.webmanifest && -s dist/.htaccess ]] ||
  fail "Build did not produce the complete static app and Apache cache policy."
printf '%s\n' "$revision" > dist/release.txt

ssh-add -l >/dev/null 2>&1 || fail "No SSH agent with a loaded key is available."
if ! ssh "${ssh_options[@]}" "$remote" true; then
  fail "Cannot connect noninteractively. Check the netcup SSH alias, loaded key and known_hosts."
fi

# Each upload gets its own staging directory; failures never remove the live site.
ssh "${ssh_options[@]}" "$remote" sh -s -- "$remote_root" "$staging" <<'REMOTE'
set -eu
cd "$1"
mkdir "$2"
REMOTE
scp "${ssh_options[@]}" -r "$script_dir/dist/." "$remote:$remote_root/$staging/"

ssh "${ssh_options[@]}" "$remote" sh -s -- "$remote_root" "$staging" "$release" "$revision" <<'REMOTE'
set -eu
cd "$1"
staging="$2"
backup=".ksuduo-releases/$3-previous"
test -s "$staging/index.html"
test -d "$staging/assets"
test -s "$staging/manifest.webmanifest"
test -s "$staging/.htaccess"
test "$(cat "$staging/release.txt")" = "$4"

# Serialize activation if two uploads finish together.
mkdir .ksuduo-deploy-lock
trap 'rmdir .ksuduo-deploy-lock' EXIT
mkdir -p .ksuduo-releases
test ! -e "$backup"
if [ -e ksuduo ] || [ -L ksuduo ]; then
  mv ksuduo "$backup"
fi
if ! mv "$staging" ksuduo; then
  if [ -e "$backup" ] || [ -L "$backup" ]; then mv "$backup" ksuduo; fi
  exit 1
fi
REMOTE

printf 'Deployed %s to https://paperclip-factory.de/ksuduo/\n' "$revision"
