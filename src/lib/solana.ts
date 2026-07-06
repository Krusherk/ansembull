import { Connection, PublicKey } from '@solana/web3.js';
import { getAssociatedTokenAddress } from '@solana/spl-token';

const RPC_URL = import.meta.env.VITE_SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com';
const ANSEM_MINT = import.meta.env.VITE_ANSEM_MINT || '9cRCn9rGT8V2imeM2BaKs13yhMEais3ruM3rPvTGpump';
const MIN_BALANCE = parseInt(import.meta.env.VITE_MIN_ANSEM_BALANCE || '10000', 10);

let connectionInstance: Connection | null = null;

export function getConnection(): Connection {
  if (!connectionInstance) {
    connectionInstance = new Connection(RPC_URL, 'confirmed');
  }
  return connectionInstance;
}

export async function checkAnsemBalance(walletAddress: string): Promise<number> {
  try {
    const connection = getConnection();
    const owner = new PublicKey(walletAddress);
    const mint = new PublicKey(ANSEM_MINT);
    const ata = await getAssociatedTokenAddress(mint, owner);

    const balance = await connection.getTokenAccountBalance(ata);
    return balance.value.uiAmount || 0;
  } catch (error: any) {
    // If the token account doesn't exist, the user holds 0 tokens
    if (
      error?.message?.includes('could not find account') ||
      error?.message?.includes('Invalid param') ||
      error?.message?.includes('AccountNotFound')
    ) {
      return 0;
    }
    console.error('Error checking $ANSEM balance:', error);
    throw error;
  }
}

export async function isHolder(walletAddress: string): Promise<boolean> {
  const balance = await checkAnsemBalance(walletAddress);
  return balance >= MIN_BALANCE;
}

export function getMinBalance(): number {
  return MIN_BALANCE;
}

export function getAnsemMint(): string {
  return ANSEM_MINT;
}
