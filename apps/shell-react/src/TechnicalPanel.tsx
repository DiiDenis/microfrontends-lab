import { UI_REACT_VERSION } from '@mfe-lab/ui-react';
import { version as shellReactVersion, useEffect, useState } from 'react';

import styles from './App.module.css';

type AccountTechnicalInfo =
  typeof import('account/technicalInfo').ACCOUNT_TECHNICAL_INFO;
type ProductsTechnicalInfo =
  typeof import('products/technicalInfo').PRODUCTS_TECHNICAL_INFO;
type ProductsPanelInfo = ProductsTechnicalInfo & {
  usesShellReactInstance: boolean;
};

type RemoteInfo<T> =
  | { status: 'error' }
  | { status: 'loading' }
  | { status: 'ready'; value: T };

export function TechnicalPanel() {
  const [accountInfo, setAccountInfo] = useState<
    RemoteInfo<AccountTechnicalInfo>
  >({ status: 'loading' });
  const [productsInfo, setProductsInfo] = useState<
    RemoteInfo<ProductsPanelInfo>
  >({ status: 'loading' });

  useEffect(() => {
    let cancelled = false;

    async function loadRemoteInformation() {
      const [productsResult, accountResult] = await Promise.allSettled([
        import('products/technicalInfo'),
        import('account/technicalInfo'),
      ]);

      if (cancelled) {
        return;
      }

      setProductsInfo(
        productsResult.status === 'fulfilled'
          ? {
              status: 'ready',
              value: {
                ...productsResult.value.PRODUCTS_TECHNICAL_INFO,
                usesShellReactInstance:
                  productsResult.value.PRODUCTS_REACT_USE_STATE_REFERENCE ===
                  useState,
              },
            }
          : { status: 'error' },
      );
      setAccountInfo(
        accountResult.status === 'fulfilled'
          ? { status: 'ready', value: accountResult.value.ACCOUNT_TECHNICAL_INFO }
          : { status: 'error' },
      );
    }

    void loadRemoteInformation();

    return () => {
      cancelled = true;
    };
  }, []);

  function readRemoteValue<T>(
    remoteInfo: RemoteInfo<T>,
    selectValue: (value: T) => string,
  ) {
    if (remoteInfo.status === 'loading') {
      return 'carregando';
    }

    if (remoteInfo.status === 'error') {
      return 'indisponível';
    }

    return selectValue(remoteInfo.value);
  }

  return (
    <details className={styles.technicalPanel}>
      <summary>Diagnóstico técnico dos micro frontends</summary>
      <dl className={styles.technicalDetails}>
        <dt>React do Shell</dt>
        <dd>{shellReactVersion}</dd>

        <dt>React informado por Products</dt>
        <dd>
          {readRemoteValue(productsInfo, (info) => info.frameworkVersion)}
        </dd>

        <dt>Products reutiliza o React do Shell</dt>
        <dd>
          {readRemoteValue(productsInfo, (info) =>
            info.usesShellReactInstance ? 'sim' : 'não',
          )}
        </dd>

        <dt>Vue informado por Account</dt>
        <dd>{readRemoteValue(accountInfo, (info) => info.frameworkVersion)}</dd>

        <dt>Remote Products</dt>
        <dd>{readRemoteValue(productsInfo, (info) => info.remoteVersion)}</dd>

        <dt>Remote Account</dt>
        <dd>{readRemoteValue(accountInfo, (info) => info.remoteVersion)}</dd>

        <dt>UI React do Shell</dt>
        <dd>{UI_REACT_VERSION}</dd>

        <dt>UI React de Products</dt>
        <dd>{readRemoteValue(productsInfo, (info) => info.uiReactVersion)}</dd>

        <dt>Manifest de Products</dt>
        <dd>
          <code>{__PRODUCTS_REMOTE_URL__}</code>
        </dd>

        <dt>Manifest de Account</dt>
        <dd>
          <code>{__ACCOUNT_REMOTE_URL__}</code>
        </dd>
      </dl>
    </details>
  );
}
