/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import flowGraphVectorMathBlocks.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./flowGraphVectorMathBlocks.pure";

import { RegisterClass } from "core/Misc/typeStore";
import {
    FlowGraphLengthBlock,
    FlowGraphNormalizeBlock,
    FlowGraphDotBlock,
    FlowGraphCrossBlock,
    FlowGraphRotate2DBlock,
    FlowGraphRotate3DBlock,
    FlowGraphTransformBlock,
    FlowGraphTransformCoordinatesBlock,
    FlowGraphConjugateBlock,
    FlowGraphAngleBetweenBlock,
    FlowGraphQuaternionFromAxisAngleBlock,
    FlowGraphAxisAngleFromQuaternionBlock,
} from "./flowGraphVectorMathBlocks.pure";
import { FlowGraphBlockNames } from "../../flowGraphBlockNames";

RegisterClass(FlowGraphBlockNames.Length, FlowGraphLengthBlock);
RegisterClass(FlowGraphBlockNames.Normalize, FlowGraphNormalizeBlock);
RegisterClass(FlowGraphBlockNames.Dot, FlowGraphDotBlock);
RegisterClass(FlowGraphBlockNames.Cross, FlowGraphCrossBlock);
RegisterClass(FlowGraphBlockNames.Rotate2D, FlowGraphRotate2DBlock);
RegisterClass(FlowGraphBlockNames.Rotate3D, FlowGraphRotate3DBlock);
RegisterClass(FlowGraphBlockNames.TransformVector, FlowGraphTransformBlock);
RegisterClass(FlowGraphBlockNames.TransformCoordinates, FlowGraphTransformCoordinatesBlock);
RegisterClass(FlowGraphBlockNames.Conjugate, FlowGraphConjugateBlock);
RegisterClass(FlowGraphBlockNames.AngleBetween, FlowGraphAngleBetweenBlock);
RegisterClass(FlowGraphBlockNames.QuaternionFromAxisAngle, FlowGraphQuaternionFromAxisAngleBlock);
RegisterClass(FlowGraphBlockNames.AxisAngleFromQuaternion, FlowGraphAxisAngleFromQuaternionBlock);
