/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import torusBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./torusBlock.pure";

import { RegisterClass } from "../../../../Misc/typeStore";
import { TorusBlock } from "./torusBlock.pure";

RegisterClass("BABYLON.TorusBlock", TorusBlock);
