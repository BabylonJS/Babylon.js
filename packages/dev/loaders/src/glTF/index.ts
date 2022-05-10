/* eslint-disable import/no-internal-modules */
export * from "./abstractFileLoader";
export * from "./glTFFileLoader";
export * from "./glEFFileLoader";
export * from "./glTFValidation";
import * as GLTF1 from "./1.0/index";
import * as GLTF2 from "./2.0/index";
export { GLTF1, GLTF2 };
