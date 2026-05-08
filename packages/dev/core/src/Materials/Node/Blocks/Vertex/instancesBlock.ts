/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import instancesBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./instancesBlock.pure";

import { RegisterClass } from "../../../../Misc/typeStore";
import { InstancesBlock } from "./instancesBlock.pure";

RegisterClass("BABYLON.InstancesBlock", InstancesBlock);
