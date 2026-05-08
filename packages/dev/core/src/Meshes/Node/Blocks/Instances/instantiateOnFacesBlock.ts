/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import instantiateOnFacesBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./instantiateOnFacesBlock.pure";

import { RegisterClass } from "../../../../Misc/typeStore";
import { InstantiateOnFacesBlock } from "./instantiateOnFacesBlock.pure";

RegisterClass("BABYLON.InstantiateOnFacesBlock", InstantiateOnFacesBlock);
