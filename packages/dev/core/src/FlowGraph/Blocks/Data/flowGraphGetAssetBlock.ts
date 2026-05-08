/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import flowGraphGetAssetBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./flowGraphGetAssetBlock.pure";

import { RegisterClass } from "core/Misc/typeStore";
import { FlowGraphGetAssetBlock } from "./flowGraphGetAssetBlock.pure";
import { FlowGraphBlockNames } from "../flowGraphBlockNames";

RegisterClass(FlowGraphBlockNames.GetAsset, FlowGraphGetAssetBlock);
