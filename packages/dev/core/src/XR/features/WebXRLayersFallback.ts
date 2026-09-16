/**
 * Re-exports the pure implementation and registers optional WebXR mesh fallbacks.
 * Import WebXRLayersFallback.pure for side-effect-free usage.
 */
export * from "./WebXRLayersFallback.pure";

import { RegisterWebXRLayersFallback } from "./WebXRLayersFallback.pure";
RegisterWebXRLayersFallback();
