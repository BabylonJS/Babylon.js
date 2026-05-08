/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import flowGraphBranchBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./flowGraphBranchBlock.pure";

import { RegisterClass } from "../../../../Misc/typeStore";
import { FlowGraphBranchBlock } from "./flowGraphBranchBlock.pure";
import { FlowGraphBlockNames } from "../../flowGraphBlockNames";

RegisterClass(FlowGraphBlockNames.Branch, FlowGraphBranchBlock);
