/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import aggregatorBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./aggregatorBlock.pure";

import { RegisterClass } from "../../../../Misc/typeStore";
import { AggregatorBlock } from "./aggregatorBlock.pure";

RegisterClass("BABYLON.AggregatorBlock", AggregatorBlock);
