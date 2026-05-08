/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import flowGraphTypeToTypeBlocks.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./flowGraphTypeToTypeBlocks.pure";

import { RegisterClass } from "core/Misc/typeStore";
import {
    FlowGraphBooleanToFloat,
    FlowGraphBooleanToInt,
    FlowGraphFloatToBoolean,
    FlowGraphIntToBoolean,
    FlowGraphIntToFloat,
    FlowGraphFloatToInt,
} from "./flowGraphTypeToTypeBlocks.pure";
import { FlowGraphBlockNames } from "../../flowGraphBlockNames";

RegisterClass(FlowGraphBlockNames.BooleanToFloat, FlowGraphBooleanToFloat);
RegisterClass(FlowGraphBlockNames.BooleanToInt, FlowGraphBooleanToInt);
RegisterClass(FlowGraphBlockNames.FloatToBoolean, FlowGraphFloatToBoolean);
RegisterClass(FlowGraphBlockNames.IntToBoolean, FlowGraphIntToBoolean);
RegisterClass(FlowGraphBlockNames.IntToFloat, FlowGraphIntToFloat);
RegisterClass(FlowGraphBlockNames.FloatToInt, FlowGraphFloatToInt);
