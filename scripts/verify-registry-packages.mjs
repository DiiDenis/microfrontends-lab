import assert from 'node:assert/strict';
import { readFile, realpath } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const registryUrl = 'http://127.0.0.1:4873/';
const repositoryRoot = fileURLToPath(new URL('../', import.meta.url));
const sourcePackagesDirectory = path.join(repositoryRoot, 'packages');
const expectations = [
  ['shell-react', 'contracts', '1.0.0'],
  ['shell-react', 'design-tokens', '1.0.0'],
  ['shell-react', 'ui-react', '1.0.0'],
  ['shell-react', 'ui-web', '1.0.0'],
  ['products-react', 'contracts', '1.0.0'],
  ['products-react', 'design-tokens', '1.0.0'],
  ['products-react', 'ui-react', '1.1.0'],
  ['account-vue', 'contracts', '1.0.0'],
  ['account-vue', 'design-tokens', '1.0.0'],
  ['account-vue', 'ui-web', '1.0.0'],
];

const registryPing = await fetch(new URL('-/ping', registryUrl));
assert.equal(registryPing.ok, true, 'O Verdaccio não respondeu ao ping');

for (const [app, packageName, expectedVersion] of expectations) {
  const manifestPath = path.join(
    repositoryRoot,
    'apps',
    app,
    'node_modules',
    '@mfe-lab',
    packageName,
    'package.json',
  );
  const installedPath = await realpath(manifestPath);
  const installedManifest = JSON.parse(await readFile(installedPath, 'utf8'));
  const relativeInstalledPath = path.relative(repositoryRoot, installedPath);

  assert.equal(
    installedManifest.version,
    expectedVersion,
    `${app} resolveu @mfe-lab/${packageName} na versão incorreta`,
  );
  assert.equal(
    path.relative(sourcePackagesDirectory, installedPath).startsWith('..'),
    true,
    `${app} está usando um link para packages/${packageName}`,
  );
  assert.match(
    relativeInstalledPath.replaceAll('\\', '/'),
    /^node_modules\/.pnpm\/@mfe-lab\+/,
    `${app} não resolveu @mfe-lab/${packageName} pelo store do pnpm`,
  );

  const encodedName = encodeURIComponent(`@mfe-lab/${packageName}`);
  const metadataResponse = await fetch(new URL(encodedName, registryUrl));
  assert.equal(
    metadataResponse.ok,
    true,
    `O Verdaccio não encontrou @mfe-lab/${packageName}`,
  );
  const metadata = await metadataResponse.json();
  assert.equal(
    Object.hasOwn(metadata.versions ?? {}, expectedVersion),
    true,
    `O Verdaccio não contém @mfe-lab/${packageName}@${expectedVersion}`,
  );

  console.log(
    `${app}: @mfe-lab/${packageName}@${expectedVersion} veio do registry`,
  );
}

console.log('Todos os pacotes instalados foram validados contra o Verdaccio.');
