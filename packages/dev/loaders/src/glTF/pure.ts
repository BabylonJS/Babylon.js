/** Pure barrel — re-exports only side-effect-free modules */
/* eslint-disable @typescript-eslint/no-restricted-imports */
export * from "./glTFFileLoader.pure";
export * from "./glTFValidation";
import * as GLTF1 from "./1.0/pure";
import * as GLTF2 from "./2.0/pure";
export { GLTF1, GLTF2 };
