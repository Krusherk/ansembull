/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_PRIVY_APP_ID: string
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY: string
  readonly VITE_SOLANA_RPC_URL: string
  readonly VITE_ANSEM_MINT: string
  readonly VITE_MIN_ANSEM_BALANCE: string
  readonly VITE_SKIP_TOKEN_GATE: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
