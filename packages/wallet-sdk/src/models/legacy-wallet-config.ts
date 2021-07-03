import { decryptContent } from '@stacks/encryption';
import { GaiaHubConfig } from '@stacks/storage';
import { fetchPrivate } from '@stacks/transactions';
import { deriveLegacyConfigPrivateKey } from '../derive';
import { getRootNode, Wallet } from './wallet';

export interface LegacyConfigApp {
  origin: string;
  scopes: string[];
  lastLoginAt: number;
  appIcon: string;
  name: string;
}

interface LegacyConfigIdentity {
  username?: string;
  address: string;
  apps: {
    [origin: string]: LegacyConfigApp;
  };
}

export interface LegacyWalletConfig {
  identities: LegacyConfigIdentity[];
  hideWarningForReusingIdentity?: boolean;
}

export async function fetchLegacyWalletConfig({
  wallet,
  gaiaHubConfig,
}: {
  wallet: Wallet;
  gaiaHubConfig: GaiaHubConfig;
}) {
  const rootNode = getRootNode(wallet);
  const legacyConfigKey = deriveLegacyConfigPrivateKey(rootNode);
  try {
    const response = await fetchPrivate(
      `${gaiaHubConfig.url_prefix}${gaiaHubConfig.address}/wallet-config.json`
    );
    if (!response.ok) return null;
    const encrypted = await response.text();
    const configJSON = (await decryptContent(encrypted, {
      privateKey: legacyConfigKey,
    })) as string;
    const config: LegacyWalletConfig = JSON.parse(configJSON);
    return config;
  } catch (error) {
    console.error(error);
    return null;
  }
}
