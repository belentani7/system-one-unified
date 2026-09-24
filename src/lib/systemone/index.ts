/**
 * System One Local — barrel público.
 *
 * NOTA: NO se re-exporta `engine.ts` aquí. El motor es server-only: arrastra el
 * proveedor de scoring (`provider.ts`, que lee `process.env` y hace `fetch`).
 * Si el barrel lo incluyera, los Client Components (como `page.tsx`) lo
 * empaquetarían para el navegador.
 *
 * El motor se importa directamente desde `./engine` SOLO en server code
 * (API routes). Tipos y helpers puros son seguros para el cliente.
 */
export * from "./schema";
export * from "./confidence";

// Presets genéricos (base) + presets personalizados NOIACORE/Belentani.
import { PRESETS as BASE_PRESETS } from "./presets";
import { NOIACORE_PRESETS } from "./presets.noiacore";

export { BASE_PRESETS };
export type { Preset } from "./presets";
export { NOIACORE_PRESETS };

/** Lista completa que consume la UI y la API: base + personalizados. */
export const PRESETS = [...BASE_PRESETS, ...NOIACORE_PRESETS];
