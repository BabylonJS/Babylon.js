/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import flowGraphDataConnection.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./flowGraphDataConnection.pure";

import { RegisterClass } from "../Misc/typeStore";
import { FlowGraphDataConnection } from "./flowGraphDataConnection.pure";

RegisterClass("FlowGraphDataConnection", FlowGraphDataConnection);
