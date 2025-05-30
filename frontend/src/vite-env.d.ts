/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  // other env variables...
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}