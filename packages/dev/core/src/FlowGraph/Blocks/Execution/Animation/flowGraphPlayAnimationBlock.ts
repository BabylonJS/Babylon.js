/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import flowGraphPlayAnimationBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./flowGraphPlayAnimationBlock.pure";

import { RegisterClass } from "../../../../Misc/typeStore";
import { FlowGraphPlayAnimationBlock } from "./flowGraphPlayAnimationBlock.pure";
import { FlowGraphBlockNames } from "../../flowGraphBlockNames";

RegisterClass(FlowGraphBlockNames.PlayAnimation, FlowGraphPlayAnimationBlock);
