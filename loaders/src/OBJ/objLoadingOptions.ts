import { Vector2 } from "babylonjs/Maths/math.vector";

/**
 * Options for loading OBJ/MTL files
 */
export type OBJLoadingOptions = {
    /**
     * Defines if UVs are optimized by default during load.
     */
    optimizeWithUV: boolean,
    /**
     * Defines custom scaling of UV coordinates of loaded meshes.
     */
    UVScaling: Vector2;
    /**
     * Invert model on y-axis (does a model scaling inversion)
     */
    invertY: boolean,
    /**
     * Invert Y-Axis of referenced textures on load
     */
    invertTextureY: boolean;
    /**
     * Include in meshes the vertex colors available in some OBJ files.  This is not part of OBJ standard.
     */
    importVertexColors: boolean,
    /**
     * Compute the normals for the model, even if normals are present in the file.
     */
    computeNormals: boolean,
    /**
     * Optimize the normals for the model. Lighting can be uneven if you use OptimizeWithUV = true because new vertices can be created for the same location if they pertain to different faces.
     * Using OptimizehNormals = true will help smoothing the lighting by averaging the normals of those vertices.
     * @since 5.0.0
     */
    optimizeNormals: boolean,
    /**
     * Skip loading the materials even if defined in the OBJ file (materials are ignored).
     */
    skipMaterials: boolean,
    /**
     * When a material fails to load OBJ loader will silently fail and onSuccess() callback will be triggered.
     */
    materialLoadingFailsSilently: boolean
};
