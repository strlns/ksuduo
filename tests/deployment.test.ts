import {mkdtempSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';
import {afterEach, expect, it} from 'vitest';

const temporary: string[] = [];
afterEach(() => {for (const dir of temporary.splice(0)) rmSync(dir, {recursive: true, force: true});});
const revision = '1234567890abcdef1234567890abcdef12345678';
function fixture() {
    const dir = mkdtempSync(join(tmpdir(), 'ksuduo-deploy-')); temporary.push(dir);
    const server = join(dir, 'server'), bin = join(dir, 'bin');
    for (const folder of ['dist/assets', 'server/ksuduo', 'bin']) mkdirSync(join(dir, folder), {recursive: true});
    for (const file of ['index.html', 'manifest.webmanifest', '.htaccess']) writeFileSync(join(dir, 'dist', file), 'new');
    writeFileSync(join(server, 'ksuduo/index.html'), 'previous');
    const script = readFileSync(new URL('../deploy-paperclip-factory.sh', import.meta.url), 'utf8')
        .replace('/paperclip-factory.de/httpdocs', server);
    writeFileSync(join(dir, 'deploy.sh'), script);
    const command = (name: string, body: string) => writeFileSync(join(bin, name), '#!/bin/bash\nset -eu\n' + body, {mode: 0o755});
    command('git', `if [[ "$1" = rev-parse ]]; then echo '${revision}'; else printf '%s' "\${FAKE_DIRTY:-}"; fi`);
    command('npm', 'exit 0');
    command('ssh-add', 'exit 0');
    command('ssh', 'while [[ "$1" != netcup ]]; do shift; done\nshift\nexec "$@"');
    command('scp', `[[ "\${FAKE_UPLOAD_FAILURE:-}" != yes ]] || exit 1
while [[ "$1" != -r ]]; do shift; done
shift
source_dir="$1"; target_dir="\${2#netcup:}"
cp -R "$source_dir" "$target_dir"`);
    const env = {...process.env, PATH: bin + ':' + process.env.PATH};
    return {dir, server, env, run: (extra = {}) => spawnSync('bash', [join(dir, 'deploy.sh')], {env: {...env, ...extra}, encoding: 'utf8'})};
}

it('uploads dotfiles, activates the complete build and retains the previous release', () => {
    const {server, run} = fixture();
    const result = run();
    expect(result.status, result.stderr).toBe(0);
    expect(readFileSync(join(server, 'ksuduo/index.html'), 'utf8')).toBe('new');
    expect(readFileSync(join(server, 'ksuduo/.htaccess'), 'utf8')).toBe('new');
    expect(readFileSync(join(server, 'ksuduo/release.txt'), 'utf8').trim()).toBe(revision);
    const [previous] = readdirSync(join(server, '.ksuduo-releases'));
    expect(readFileSync(join(server, '.ksuduo-releases', previous, 'index.html'), 'utf8')).toBe('previous');
    expect(readdirSync(server)).not.toContain('.ksuduo-deploy-lock');
});

it('leaves the live release in place when an upload fails', () => {
    const {server, run} = fixture();
    expect(run({FAKE_UPLOAD_FAILURE: 'yes'}).status).not.toBe(0);
    expect(readFileSync(join(server, 'ksuduo/index.html'), 'utf8')).toBe('previous');
    expect(readdirSync(server)).not.toContain('.ksuduo-releases');
});

it.each([{FAKE_DIRTY: ' M index.html'}, {KSUDUO_DEPLOY_COMMIT: 'another-commit'}])('rejects an uncommitted or mismatched checkout: %s', extra => {
    const {server, run} = fixture();
    expect(run(extra).status).not.toBe(0);
    expect(readdirSync(server)).toEqual(['ksuduo']);
});

it('only deploys non-deleted master updates to origin and detaches the deploy from hook stdin', () => {
    const {dir, env} = fixture();
    writeFileSync(join(dir, 'bin/git'), `#!/bin/bash\necho '${dir}'\n`, {mode: 0o755});
    writeFileSync(join(dir, 'deploy-paperclip-factory.sh'), `#!/bin/bash
printf '%s' "$KSUDUO_DEPLOY_COMMIT" >> '${dir}/invocations'
if read -r unexpected; then exit 1; fi
`, {mode: 0o755});
    const hook = new URL('../.githooks/pre-push', import.meta.url).pathname;
    const input = `refs/heads/master ${revision} refs/heads/master abc\nrefs/heads/topic def refs/heads/topic abc\n`;
    for (const remote of ['backup', 'origin']) expect(spawnSync('bash', [hook, remote], {env, input}).status).toBe(0);
    expect(readFileSync(join(dir, 'invocations'), 'utf8')).toBe(revision);
    const deleted = `refs/heads/master ${'0'.repeat(40)} refs/heads/master abc\n`;
    expect(spawnSync('bash', [hook, 'origin'], {env, input: deleted}).status).toBe(0);
    expect(readFileSync(join(dir, 'invocations'), 'utf8')).toBe(revision);
});
