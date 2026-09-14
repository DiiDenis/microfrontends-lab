import assert from 'node:assert/strict';

import { chromium } from '@playwright/test';

const shellUrl = 'http://localhost:8080';
const productsUrl = 'http://localhost:8081';
const accountUrl = 'http://localhost:8082';
const expectAccountUnavailable =
  process.env.EXPECT_ACCOUNT_UNAVAILABLE === 'true';
const expectedProductsVersion = process.env.EXPECTED_PRODUCTS_VERSION;

async function fetchOk(url) {
  const response = await fetch(url);
  assert.equal(response.ok, true, `${url} respondeu ${response.status}`);
  return response;
}

const shellResponse = await fetchOk(`${shellUrl}/products`);
assert.match(await shellResponse.text(), /<div id="root"><\/div>/);

const productsManifestResponse = await fetchOk(
  `${productsUrl}/mf-manifest.json`,
);
assert.equal(
  productsManifestResponse.headers.get('cache-control'),
  'no-store',
);
assert.equal(
  productsManifestResponse.headers.get('access-control-allow-origin'),
  shellUrl,
);

const productsManifest = await productsManifestResponse.json();
assert.equal(productsManifest.metaData.publicPath, `${productsUrl}/`);

const productExpose = productsManifest.exposes.find(
  (expose) => expose.path === './ProductApp',
);
assert.ok(productExpose, 'O expose ./ProductApp não foi encontrado');

const productChunk = productExpose.assets.js.sync[0];
assert.ok(productChunk, 'O chunk síncrono de ProductApp não foi encontrado');

const productChunkResponse = await fetchOk(`${productsUrl}/${productChunk}`);
assert.match(
  productChunkResponse.headers.get('cache-control') ?? '',
  /immutable/,
);

if (!expectAccountUnavailable) {
  const accountManifestResponse = await fetchOk(
    `${accountUrl}/mf-manifest.json`,
  );
  assert.equal(accountManifestResponse.headers.get('cache-control'), 'no-store');
  const accountManifest = await accountManifestResponse.json();
  assert.equal(accountManifest.metaData.publicPath, `${accountUrl}/`);
  assert.ok(
    accountManifest.exposes.some((expose) => expose.path === './mount'),
    'O expose ./mount não foi encontrado',
  );
}

const browser = await chromium.launch();

try {
  const page = await browser.newPage();

  await page.goto(`${shellUrl}/products`);
  await page
    .getByText('PRODUCTS · REACT · STANDALONE', { exact: true })
    .waitFor();

  const remoteVersion = await page
    .getByText(/^Remote version: products-v\d+$/)
    .textContent();

  if (expectedProductsVersion) {
    assert.equal(remoteVersion, `Remote version: ${expectedProductsVersion}`);
  }

  await page.goto(`${shellUrl}/account`);

  if (expectAccountUnavailable) {
    await page.getByRole('heading', { name: 'Account indisponível' }).waitFor();
  } else {
    await page
      .getByText('ACCOUNT · VUE · STANDALONE', { exact: true })
      .waitFor();
  }

  console.log(`Shell: ${shellUrl}`);
  console.log(`Products: ${remoteVersion}`);
  console.log(
    expectAccountUnavailable
      ? 'Account: fallback isolado visível'
      : 'Account: remote Vue montado',
  );
  console.log('Cache/CORS/manifests/chunks: válidos');
} finally {
  await browser.close();
}
