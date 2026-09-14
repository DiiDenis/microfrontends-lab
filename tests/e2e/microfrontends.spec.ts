import { expect, test } from '@playwright/test';

test('Home abre no Shell', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByText('SHELL · REACT', { exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Home' })).toBeVisible();
  await expect(page.locator('[data-mfe-owner="shell-react"]')).toHaveCount(1);
});

test('Products é composto e atualiza o carrinho do Shell', async ({ page }) => {
  const manifestResponse = page.waitForResponse(
    (response) =>
      response.url() === 'http://localhost:3001/mf-manifest.json' &&
      response.ok(),
  );

  await page.goto('/');
  await page.getByRole('link', { name: 'Products' }).click();
  await manifestResponse;

  await expect(
    page.getByText('PRODUCTS · REACT · STANDALONE', { exact: true }),
  ).toBeVisible();
  await expect(page.locator('[data-mfe-owner="products-react"]')).toHaveCount(
    1,
  );

  await page.getByRole('button', { name: 'Adicionar' }).first().click();

  await expect(page.getByText('Itens adicionados: 1')).toBeVisible();
  await expect(page.getByText('Carrinho: 1')).toBeVisible();
});

test('Account é composto, comunica o papel e não duplica a montagem', async ({
  page,
}) => {
  const manifestResponse = page.waitForResponse(
    (response) =>
      response.url() === 'http://localhost:3002/mf-manifest.json' &&
      response.ok(),
  );

  await page.goto('/');
  await page.getByRole('link', { name: 'Account' }).click();
  await manifestResponse;

  const accountRoot = page.locator('[data-mfe-owner="account-vue"]');

  await expect(
    page.getByText('ACCOUNT · VUE · STANDALONE', { exact: true }),
  ).toBeVisible();
  await expect(accountRoot).toHaveCount(1);
  await expect(
    page.getByText('Usuário: Denis · Administrador', { exact: true }),
  ).toBeVisible();

  await page.getByRole('button', { name: 'Alternar papel' }).click();
  await expect(
    page.getByText('Usuário: Denis · Operador', { exact: true }),
  ).toBeVisible();

  await page.getByRole('link', { name: 'Home' }).click();
  await expect(accountRoot).toHaveCount(0);
  await page.getByRole('link', { name: 'Account' }).click();

  await expect(accountRoot).toHaveCount(1);
  await expect(
    page.getByText('Usuário: Denis · Administrador', { exact: true }),
  ).toBeVisible();
});

test('falha de Products fica isolada e Home continua disponível', async ({
  page,
}) => {
  await page.route('http://localhost:3001/**', async (route) => {
    await route.abort('connectionrefused');
  });

  await page.goto('/products');

  await expect(
    page.getByRole('heading', { name: 'Products indisponível' }),
  ).toBeVisible();
  await expect(page.getByRole('alert')).toContainText(
    'Não foi possível carregar o remote Products.',
  );

  await page.getByRole('link', { name: 'Home' }).click();
  await expect(page.getByRole('heading', { name: 'Home' })).toBeVisible();
});
