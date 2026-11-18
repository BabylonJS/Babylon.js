/** A glTF shape resolved to its defaulted parameters or triangle geometry. */
export type GLTFShape =
    | { type: "box"; size: number[] }
    | { type: "sphere"; radius: number }
    | { type: "capsule" | "cylinder"; height: number; radiusTop: number; radiusBottom: number }
    | { type: "plane"; sizeX: number | undefined; sizeZ: number | undefined }
    | { type: "mesh" | "convexMesh"; positions: Float32Array; indices: Uint32Array };
