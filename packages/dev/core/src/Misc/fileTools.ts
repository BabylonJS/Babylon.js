/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import fileTools.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./fileTools.pure";

import { LoadFile, LoadImage, RegisterFileTools } from "./fileTools.pure";
import { AbstractEngine } from "../Engines/abstractEngine";
import { EngineFunctionContext } from "../Engines/abstractEngine.functions";
import { _FunctionContainer } from "../Engines/Processors/shaderProcessor";

RegisterFileTools();

// Restore the lazy side-effect injection so a bare engine import (e.g. Engines/thinEngine) does not
// statically pull in the file/network loading graph (fileTools -> webRequest -> retryStrategy /
// filesInputStore / ...). Importing this module (or the Misc barrel) wires the real implementations
// onto the engine on demand, keeping them out of bundles that never load files.
AbstractEngine._FileToolsLoadImage = LoadImage;
EngineFunctionContext.loadFile = LoadFile;
_FunctionContainer.loadFile = LoadFile;
