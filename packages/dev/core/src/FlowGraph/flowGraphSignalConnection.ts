/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import flowGraphSignalConnection.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./flowGraphSignalConnection.pure";

import { RegisterClass } from "../Misc/typeStore";
import { FlowGraphSignalConnection } from "./flowGraphSignalConnection.pure";

RegisterClass("FlowGraphSignalConnection", FlowGraphSignalConnection);
