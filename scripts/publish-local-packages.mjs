import { spawnSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const registryUrl = 'http://127.0.0.1:4873/';
const packageDirectories = [
  'packages/contracts',
  'packages/design-tokens',
  'packages/ui-react',
  'packages/ui-web',
];
const repositoryRoot = fileURLToPath(new URL('../', import.meta.url));
const pnpmCommand = 'pnpm';

async function readPackageManifest(packageDirectory) {
  const manifestUrl = new URL(
    `../${packageDirectory}/package.json`,
    import.meta.url,
  );
  return JSON.parse(await readFile(manifestUrl, 'utf8'));
}

async function isPublished(packageName, version) {
  const packagePath = packageName.replace('/', '%2f');
  const response = await fetch(new URL(packagePath, registryUrl));

  if (response.status === 404) {
    return false;
  }

  if (!response.ok) {
    throw new Error(
      `Verdaccio respondeu ${response.status} ao consultar ${packageName}.`,
    );
  }

  const metadata = await response.json();
  return Object.hasOwn(metadata.versions ?? {}, version);
}

function publishPackage(packageDirectory, packageName, version) {
  console.log(`Publicando ${packageName}@${version}...`);

  const publishArguments = [
    '--dir',
    packageDirectory,
    'publish',
    '--registry',
    registryUrl,
    '--access',
    'restricted',
    '--no-git-checks',
  ];
  const command =
    process.platform === 'win32'
      ? (process.env.ComSpec ?? 'cmd.exe')
      : pnpmCommand;
  const commandArguments =
    process.platform === 'win32'
      ? ['/d', '/s', '/c', pnpmCommand, ...publishArguments]
      : publishArguments;

  const result = spawnSync(
    command,
    commandArguments,
    {
      cwd: repositoryRoot,
      stdio: 'inherit',
    },
  );

  if (result.status !== 0) {
    throw new Error(`Falha ao publicar ${packageName}@${version}.`);
  }
}

const pingResponse = await fetch(new URL('-/ping', registryUrl));

if (!pingResponse.ok) {
  throw new Error(`Verdaccio indisponível em ${registryUrl}.`);
}

for (const packageDirectory of packageDirectories) {
  const manifest = await readPackageManifest(packageDirectory);

  if (await isPublished(manifest.name, manifest.version)) {
    console.log(`${manifest.name}@${manifest.version} já está publicado; pulando.`);
    continue;
  }

  publishPackage(packageDirectory, manifest.name, manifest.version);
}
