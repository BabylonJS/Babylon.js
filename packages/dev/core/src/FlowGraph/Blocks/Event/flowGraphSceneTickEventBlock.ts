/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import flowGraphSceneTickEventBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./flowGraphSceneTickEventBlock.pure";

import { RegisterClass } from "../../../Misc/typeStore";
import { FlowGraphSceneTickEventBlock } from "./flowGraphSceneTickEventBlock.pure";
import { FlowGraphBlockNames } from "../flowGraphBlockNames";

RegisterClass(FlowGraphBlockNames.SceneTickEvent, FlowGraphSceneTickEventBlock);
