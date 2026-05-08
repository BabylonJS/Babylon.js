/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import voronoiNoiseBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./voronoiNoiseBlock.pure";

import { RegisterClass } from "../../../Misc/typeStore";
import { VoronoiNoiseBlock } from "./voronoiNoiseBlock.pure";

RegisterClass("BABYLON.VoronoiNoiseBlock", VoronoiNoiseBlock);
