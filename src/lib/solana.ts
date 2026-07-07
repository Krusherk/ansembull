import { Connection, PublicKey } from '@solana/web3.js';
import { getAssociatedTokenAddress } from '@solana/spl-token';

const RPC_URL = import.meta.env.VITE_SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com';
const ANSEM_MINT = import.meta.env.VITE_ANSEM_MINT || '9cRCn9rGT8V2imeM2BaKs13yhMEais3ruM3rPvTGpump';
const MIN_BALANCE = parseFloat(import.meta.env.VITE_MIN_ANSEM_BALANCE || '0.1');
const SKIP_TOKEN_GATE = import.meta.env.VITE_SKIP_TOKEN_GATE === 'true';

let connectionInstance: Connection | null = null;

export function getConnection(): Connection {
  if (!connectionInstance) {
    connectionInstance = new Connection(RPC_URL, 'confirmed');
  }
  return connectionInstance;
}

export async function checkAnsemBalance(walletAddress: string): Promise<number> {
  if (SKIP_TOKEN_GATE) return 999999;

  try {
    const connection = getConnection();
    const owner = new PublicKey(walletAddress);
    const mint = new PublicKey(ANSEM_MINT);
    const ata = await getAssociatedTokenAddress(mint, owner);

    const balance = await connection.getTokenAccountBalance(ata);
    return balance.value.uiAmount || 0;
  } catch (error: any) {
    if (
      error?.message?.includes('could not find account') ||
      error?.message?.includes('Invalid param') ||
      error?.message?.includes('AccountNotFound')
    ) {
      return 0;
    }
    console.error('Error checking $ANSEM balance:', error);
    return 0;
  }
}

export async function isHolder(walletAddress: string): Promise<boolean> {
  if (SKIP_TOKEN_GATE) return true;
  if (MIN_BALANCE <= 0) return true;
  const balance = await checkAnsemBalance(walletAddress);
  return balance >= MIN_BALANCE;
}

export function getMinBalance(): number {
  return MIN_BALANCE;
}

export function isGateBypassed(): boolean {
  return SKIP_TOKEN_GATE;
}
