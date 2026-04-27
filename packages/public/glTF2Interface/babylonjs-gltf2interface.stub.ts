/**
 * Runtime stub for babylonjs-gltf2interface.
 *
 * The real package only ships a .d.ts with const-enum declarations (no JS).
 * TypeScript inlines const-enum values at compile time, but Vite's resolver
 * runs before TS compilation and needs a resolvable JS module. This file
 * re-exports the enum values so the glTF loader can work in vitest.
 */

/* eslint-disable @typescript-eslint/naming-convention */
export const AccessorComponentType = { BYTE: 5120, UNSIGNED_BYTE: 5121, SHORT: 5122, UNSIGNED_SHORT: 5123, UNSIGNED_INT: 5125, FLOAT: 5126 };
export const AccessorType = { SCALAR: "SCALAR", VEC2: "VEC2", VEC3: "VEC3", VEC4: "VEC4", MAT2: "MAT2", MAT3: "MAT3", MAT4: "MAT4" };
export const AnimationChannelTargetPath = { TRANSLATION: "translation", ROTATION: "rotation", SCALE: "scale", WEIGHTS: "weights", POINTER: "pointer" };
export const AnimationSamplerInterpolation = { LINEAR: "LINEAR", STEP: "STEP", CUBICSPLINE: "CUBICSPLINE" };
export const CameraType = { PERSPECTIVE: "perspective", ORTHOGRAPHIC: "orthographic" };
export const MaterialAlphaMode = { OPAQUE: "OPAQUE", MASK: "MASK", BLEND: "BLEND" };
export const MeshPrimitiveMode = { POINTS: 0, LINES: 1, LINE_LOOP: 2, LINE_STRIP: 3, TRIANGLES: 4, TRIANGLE_STRIP: 5, TRIANGLE_FAN: 6 };
export const TextureMagFilter = { NEAREST: 9728, LINEAR: 9729 };
export const TextureMinFilter = { NEAREST: 9728, LINEAR: 9729, NEAREST_MIPMAP_NEAREST: 9984, LINEAR_MIPMAP_NEAREST: 9985, NEAREST_MIPMAP_LINEAR: 9986, LINEAR_MIPMAP_LINEAR: 9987 };
export const TextureWrapMode = { CLAMP_TO_EDGE: 33071, MIRRORED_REPEAT: 33648, REPEAT: 10497 };
export const ImageMimeType = { JPEG: "image/jpeg", PNG: "image/png", WEBP: "image/webp" };
export const KHRLightsPunctual_LightType = { DIRECTIONAL: "directional", POINT: "point", SPOT: "spot" };
