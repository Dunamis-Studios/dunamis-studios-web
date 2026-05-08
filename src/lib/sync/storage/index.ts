import { VercelBlobStorage } from "./vercel-blob";
import type { SyncStorage } from "./types";

export type { SyncStorage } from "./types";
export {
  buildBlobKey,
  buildManifestKey,
  buildCustomerPrefix,
} from "./types";

/**
 * Storage backend factory. v1 only resolves to VercelBlobStorage; the
 * `SYNC_STORAGE_BACKEND` env hook is reserved for the eventual
 * Cloudflare R2 migration per spec §11.8. The hook is a future
 * affordance — there is no other backend today, and changing this env
 * var with no `R2Storage` class on disk would crash boot.
 */
let cachedStorage: SyncStorage | null = null;

export function getStorage(): SyncStorage {
  if (cachedStorage) return cachedStorage;
  const backend = process.env.SYNC_STORAGE_BACKEND ?? "vercel-blob";
  switch (backend) {
    case "vercel-blob":
      cachedStorage = new VercelBlobStorage();
      return cachedStorage;
    default:
      throw new Error(
        `Unknown SYNC_STORAGE_BACKEND="${backend}". Valid values: "vercel-blob".`,
      );
  }
}
