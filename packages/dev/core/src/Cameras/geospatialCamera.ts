/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import geospatialCamera.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./geospatialCamera.pure";

import { RegisterGeospatialCamera } from "./geospatialCamera.pure";
RegisterGeospatialCamera();
