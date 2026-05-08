/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import viewDirectionBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./viewDirectionBlock.pure";

import { RegisterClass } from "../../../Misc/typeStore";
import { ViewDirectionBlock } from "./viewDirectionBlock.pure";

RegisterClass("BABYLON.ViewDirectionBlock", ViewDirectionBlock);
