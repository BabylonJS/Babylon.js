/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import shadowMapBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./shadowMapBlock.pure";

import { RegisterClass } from "../../../../Misc/typeStore";
import { ShadowMapBlock } from "./shadowMapBlock.pure";

RegisterClass("BABYLON.ShadowMapBlock", ShadowMapBlock);
