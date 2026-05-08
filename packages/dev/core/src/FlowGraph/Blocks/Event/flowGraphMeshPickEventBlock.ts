/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import flowGraphMeshPickEventBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./flowGraphMeshPickEventBlock.pure";

import { RegisterClass } from "../../../Misc/typeStore";
import { FlowGraphMeshPickEventBlock } from "./flowGraphMeshPickEventBlock.pure";
import { FlowGraphBlockNames } from "../flowGraphBlockNames";

RegisterClass(FlowGraphBlockNames.MeshPickEvent, FlowGraphMeshPickEventBlock);
