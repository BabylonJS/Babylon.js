/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import updateDirectionBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./updateDirectionBlock.pure";

import { RegisterClass } from "../../../../Misc/typeStore";
import { UpdateDirectionBlock } from "./updateDirectionBlock.pure";

RegisterClass("BABYLON.UpdateDirectionBlock", UpdateDirectionBlock);
