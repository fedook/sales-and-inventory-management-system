/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Full URL of the Express API, e.g. http://localhost:7000/api */
  readonly VITE_API_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
