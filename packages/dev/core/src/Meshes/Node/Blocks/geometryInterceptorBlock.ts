/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import geometryInterceptorBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./geometryInterceptorBlock.pure";

import { RegisterClass } from "../../../Misc/typeStore";
import { GeometryInterceptorBlock } from "./geometryInterceptorBlock.pure";

RegisterClass("BABYLON.GeometryInterceptorBlock", GeometryInterceptorBlock);
