/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import geospatialCamera.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./geospatialCamera.pure";

import { RegisterClass } from "../Misc/typeStore";
import { GeospatialCamera } from "./geospatialCamera.pure";

RegisterClass("BABYLON.GeospatialCamera", GeospatialCamera);
