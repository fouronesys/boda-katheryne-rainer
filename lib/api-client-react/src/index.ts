export * from "./generated/api";
export * from "./generated/api.schemas";
export {
  setBaseUrl,
  setAuthTokenGetter,
  setAdminPassword,
  setPanelPassword,
  customFetch,
} from "./custom-fetch";
export type { AuthTokenGetter } from "./custom-fetch";
