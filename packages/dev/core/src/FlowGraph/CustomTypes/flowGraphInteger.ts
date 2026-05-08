/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import flowGraphInteger.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./flowGraphInteger.pure";

import { RegisterClass } from "../../Misc/typeStore";
import { FlowGraphInteger } from "./flowGraphInteger.pure";

RegisterClass("FlowGraphInteger", FlowGraphInteger);
