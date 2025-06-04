// import type { Mesh, TransformNode } from "core/Meshes";
// import type { RawLottieLayer, RawScalarProperty, RawTransform, RawVectorKeyframe, RawVectorProperty } from "./types/rawLottie";
// import type { ScalarKeyframe, ScalarProperty, Transform, Vector2Keyframe, Vector2Property } from "./types/processedLottie";
// import { BezierCurveEase } from "core/Animations";
// import { Vector2 } from "core/Maths";

// /**
//  * Class representing a lottie layer in Babylon terms.
//  * Each lottie layer has two transforms:
//  * - The node that represents the Position/Rotation/Scale of the layer.
//  * - The node that represents the Anchor of the layer.
//  */
// export class LottieNode {
//     private _trs: TransformNode | Mesh | undefined = undefined;
//     private _offset: TransformNode | Mesh | undefined = undefined;
//     private _parent: LottieNode | undefined = undefined;
//     private _children: LottieNode[] = [];

//     private constructor() {}

//     public update(): void {
//         for (const child of this._children) {
//             child.update();
//         }
//     }

//     public static FromLottieLayer(rawLayer: RawLottieLayer): LottieNode {
//         const node = new LottieNode();
//         const transform = LottieNode._ProcessLottieTransform(rawLayer.ks);

//         return node;
//     }

//     private static _ProcessLottieTransform(transform: RawTransform): Transform {
//         return {
//             opacity: LottieNode._FromLottieScalarToBabylonScalar(transform.o),
//             rotation: LottieNode._FromLottieScalarToBabylonScalar(transform.r),
//             scale: LottieNode._FromLottieVector2ToBabylonVector2(transform.s),
//             position: LottieNode._FromLottieVector2ToBabylonVector2(transform.p),
//             anchorPoint: LottieNode._FromLottieVector2ToBabylonVector2(transform.a),
//         };
//     }

//     private static _FromLottieScalarToBabylonScalar(property: RawScalarProperty | undefined): ScalarProperty | undefined {
//         if (!property) {
//             return undefined;
//         }

//         if (property.a === 0) {
//             return {
//                 startValue: property.k as number,
//             };
//         }

//         const keyframes: ScalarKeyframe[] = [];
//         const rawKeyFrames = property.k as RawVectorKeyframe[];
//         let i = 0;
//         for (i = 0; i < rawKeyFrames.length; i++) {
//             let easeFunction: BezierCurveEase | undefined = undefined;
//             if (rawKeyFrames[i].i !== undefined && rawKeyFrames[i].o !== undefined) {
//                 easeFunction = new BezierCurveEase(rawKeyFrames[i].i!.x[0], rawKeyFrames[i].i!.y[0], rawKeyFrames[i].o!.x[0], rawKeyFrames[i].o!.y[0]);
//             }

//             keyframes.push({
//                 value: rawKeyFrames[i].s[0],
//                 time: rawKeyFrames[i].t,
//                 easeFunction,
//             });
//         }

//         // DEBUGGING - Add one extra keyframe at the end to make sure the animation reaches the end value
//         keyframes.push({
//             value: rawKeyFrames[i - 1].s[0],
//             time: rawKeyFrames[i - 1].t + 1,
//             easeFunction: keyframes[i - 2].easeFunction,
//         });

//         return {
//             startValue: rawKeyFrames[0].s[0],
//             keyframes: keyframes,
//         };
//     }

//     private static _FromLottieVector2ToBabylonVector2(property: RawVectorProperty | undefined): Vector2Property | undefined {
//         if (!property) {
//             return undefined;
//         }

//         if (property.l !== undefined && property.l !== 2) {
//             return undefined;
//         }

//         if (property.a === 0) {
//             const values = property.k as number[];
//             return {
//                 startValue: new Vector2(values[0], values[1]),
//             };
//         }

//         const keyframes: Vector2Keyframe[] = [];
//         const rawKeyFrames = property.k as RawVectorKeyframe[];
//         let i = 0;
//         for (i = 0; i < rawKeyFrames.length; i++) {
//             let easeFunction1: BezierCurveEase | undefined = undefined;
//             if (rawKeyFrames[i].i !== undefined && rawKeyFrames[i].o !== undefined) {
//                 easeFunction1 = new BezierCurveEase(rawKeyFrames[i].i!.x[0], rawKeyFrames[i].i!.y[0], rawKeyFrames[i].o!.x[0], rawKeyFrames[i].o!.y[0]);
//             }

//             let easeFunction2: BezierCurveEase | undefined = undefined;
//             if (rawKeyFrames[i].i !== undefined && rawKeyFrames[i].o !== undefined) {
//                 easeFunction2 = new BezierCurveEase(rawKeyFrames[i].i!.x[1], rawKeyFrames[i].i!.y[1], rawKeyFrames[i].o!.x[1], rawKeyFrames[i].o!.y[1]);
//             }

//             keyframes.push({
//                 value: new Vector2(rawKeyFrames[i].s[0], rawKeyFrames[i].s[1]),
//                 time: rawKeyFrames[i].t,
//                 easeFunction1,
//                 easeFunction2,
//             });
//         }

//         // DEBUGGING - Add one extra keyframe at the end to make sure the animation reaches the end value
//         keyframes.push({
//             value: new Vector2(rawKeyFrames[i - 1].s[0], rawKeyFrames[i - 1].s[1]),
//             time: rawKeyFrames[i - 1].t + 1,
//             easeFunction1: keyframes[i - 2].easeFunction1,
//             easeFunction2: keyframes[i - 2].easeFunction2,
//         });

//         return {
//             startValue: new Vector2(rawKeyFrames[0].s[0], rawKeyFrames[0].s[1]),
//             keyframes: keyframes,
//         };
//     }
// }
