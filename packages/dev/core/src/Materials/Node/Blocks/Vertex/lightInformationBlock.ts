/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import lightInformationBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./lightInformationBlock.pure";

import { RegisterClass } from "../../../../Misc/typeStore";
import { LightInformationBlock } from "./lightInformationBlock.pure";

RegisterClass("BABYLON.LightInformationBlock", LightInformationBlock);
