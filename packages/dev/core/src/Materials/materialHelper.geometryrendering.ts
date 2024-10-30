import { Constants } from "core/Engines/constants";
import type { MaterialDefines } from "core/Materials/materialDefines";
import type { Effect } from "core/Materials/effect";
import type { Mesh } from "core/Meshes/mesh";
import type { AbstractMesh } from "core/Meshes/abstractMesh";
import { Matrix } from "core/Maths/math.vector";

/**
 * Type of clear operation to perform on a geometry texture.
 */
export const enum GeometryRenderingTextureClearType {
    /**
     * Clear the texture with zero.
     */
    Zero = 0,

    /**
     * Clear the texture with one.
     */
    One = 1,

    /**
     * Clear the texture with the maximum view Z value.
     */
    MaxViewZ = 2,
}

/**
 * Configuration for geometry rendering.
 * A configuration is created for each rendering pass a geometry rendering is used in.
 */
export type GeometryRenderingConfiguration = {
    /**
     * Defines used for the geometry rendering.
     */
    defines: { [name: string]: number };

    /**
     * Previous world matrices for meshes.
     */
    previousWorldMatrices: { [index: number]: Matrix };

    /**
     * Previous view projection matrix.
     */
    previousViewProjection: Matrix;

    /**
     * Current view projection matrix.
     */
    currentViewProjection: Matrix;

    /**
     * Previous bones for skinned meshes.
     */
    previousBones: { [index: number]: Float32Array };

    /**
     * Last frame id the configuration was updated.
     */
    lastUpdateFrameId: number;

    /**
     * List of excluded skinned meshes.
     */
    excludedSkinnedMesh: AbstractMesh[];
};

/**
 * Helper class to manage geometry rendering.
 */
export class MaterialHelperGeometryRendering {
    /**
     * Descriptions of the geometry textures.
     */
    public static readonly GeometryTextureDescriptions = [
        {
            type: Constants.PREPASS_IRRADIANCE_TEXTURE_TYPE,
            name: "Irradiance",
            clearType: GeometryRenderingTextureClearType.Zero,
            define: "PREPASS_IRRADIANCE",
            defineIndex: "PREPASS_IRRADIANCE_INDEX",
        },
        {
            type: Constants.PREPASS_POSITION_TEXTURE_TYPE,
            name: "WorldPosition",
            clearType: GeometryRenderingTextureClearType.Zero,
            define: "PREPASS_POSITION",
            defineIndex: "PREPASS_POSITION_INDEX",
        },
        {
            type: Constants.PREPASS_VELOCITY_TEXTURE_TYPE,
            name: "Velocity",
            clearType: GeometryRenderingTextureClearType.Zero,
            define: "PREPASS_VELOCITY",
            defineIndex: "PREPASS_VELOCITY_INDEX",
        },
        {
            type: Constants.PREPASS_REFLECTIVITY_TEXTURE_TYPE,
            name: "Reflectivity",
            clearType: GeometryRenderingTextureClearType.Zero,
            define: "PREPASS_REFLECTIVITY",
            defineIndex: "PREPASS_REFLECTIVITY_INDEX",
        },
        {
            type: Constants.PREPASS_DEPTH_TEXTURE_TYPE,
            name: "ViewDepth",
            clearType: GeometryRenderingTextureClearType.MaxViewZ,
            define: "PREPASS_DEPTH",
            defineIndex: "PREPASS_DEPTH_INDEX",
        },
        {
            type: Constants.PREPASS_NORMAL_TEXTURE_TYPE,
            name: "ViewNormal",
            clearType: GeometryRenderingTextureClearType.Zero,
            define: "PREPASS_NORMAL",
            defineIndex: "PREPASS_NORMAL_INDEX",
        },
        {
            type: Constants.PREPASS_ALBEDO_SQRT_TEXTURE_TYPE,
            name: "AlbedoSqrt",
            clearType: GeometryRenderingTextureClearType.Zero,
            define: "PREPASS_ALBEDO_SQRT",
            defineIndex: "PREPASS_ALBEDO_SQRT_INDEX",
        },
        {
            type: Constants.PREPASS_WORLD_NORMAL_TEXTURE_TYPE,
            name: "WorldNormal",
            clearType: GeometryRenderingTextureClearType.Zero,
            define: "PREPASS_WORLD_NORMAL",
            defineIndex: "PREPASS_WORLD_NORMAL_INDEX",
        },
        {
            type: Constants.PREPASS_LOCAL_POSITION_TEXTURE_TYPE,
            name: "LocalPosition",
            clearType: GeometryRenderingTextureClearType.Zero,
            define: "PREPASS_LOCAL_POSITION",
            defineIndex: "PREPASS_LOCAL_POSITION_INDEX",
        },
        {
            type: Constants.PREPASS_SCREENSPACE_DEPTH_TEXTURE_TYPE,
            name: "ScreenDepth",
            clearType: GeometryRenderingTextureClearType.One,
            define: "PREPASS_SCREENSPACE_DEPTH",
            defineIndex: "PREPASS_SCREENSPACE_DEPTH_INDEX",
        },
        {
            type: Constants.PREPASS_VELOCITY_LINEAR_TEXTURE_TYPE,
            name: "LinearVelocity",
            clearType: GeometryRenderingTextureClearType.Zero,
            define: "PREPASS_VELOCITY_LINEAR",
            defineIndex: "PREPASS_VELOCITY_LINEAR_INDEX",
        },
        {
            type: Constants.PREPASS_ALBEDO_TEXTURE_TYPE,
            name: "Albedo",
            clearType: GeometryRenderingTextureClearType.Zero,
            define: "PREPASS_ALBEDO",
            defineIndex: "PREPASS_ALBEDO_INDEX",
        },
    ];

    private static _Configurations: { [renderPassId: number]: GeometryRenderingConfiguration } = {};

    /**
     * Creates a new geometry rendering configuration.
     * @param renderPassId Render pass id the configuration is created for.
     * @returns The created configuration.
     */
    public static CreateConfiguration(renderPassId: number) {
        MaterialHelperGeometryRendering._Configurations[renderPassId] = {
            defines: {},
            previousWorldMatrices: {},
            previousViewProjection: Matrix.Zero(),
            currentViewProjection: Matrix.Zero(),
            previousBones: {},
            lastUpdateFrameId: -1,
            excludedSkinnedMesh: [],
        };
        return MaterialHelperGeometryRendering._Configurations[renderPassId];
    }

    /**
     * Deletes a geometry rendering configuration.
     * @param renderPassId The render pass id of the configuration to delete.
     */
    public static DeleteConfiguration(renderPassId: number) {
        delete MaterialHelperGeometryRendering._Configurations[renderPassId];
    }

    /**
     * Gets a geometry rendering configuration.
     * @param renderPassId The render pass id of the configuration to get.
     * @returns The configuration.
     */
    public static GetConfiguration(renderPassId: number): GeometryRenderingConfiguration {
        return MaterialHelperGeometryRendering._Configurations[renderPassId];
    }

    /**
     * Adds uniforms and samplers for geometry rendering.
     * @param uniforms The array of uniforms to add to.
     * @param _samplers The array of samplers to add to.
     */
    public static AddUniformsAndSamplers(uniforms: string[], _samplers: string[]) {
        uniforms.push("previousWorld", "previousViewProjection", "mPreviousBones");
    }

    /**
     * Marks a list of meshes as dirty for geometry rendering.
     * @param renderPassId The render pass id the meshes are marked as dirty for.
     * @param meshes The list of meshes to mark as dirty.
     */
    public static MarkAsDirty(renderPassId: number, meshes: AbstractMesh[]) {
        for (const mesh of meshes) {
            if (!mesh.subMeshes) {
                continue;
            }

            for (const subMesh of mesh.subMeshes) {
                subMesh._removeDrawWrapper(renderPassId);
            }
        }
    }

    /**
     * Prepares defines for geometry rendering.
     * @param renderPassId The render pass id the defines are prepared for.
     * @param mesh The mesh the defines are prepared for.
     * @param defines The defines to update according to the geometry rendering configuration.
     */
    public static PrepareDefines(renderPassId: number, mesh: AbstractMesh, defines: MaterialDefines) {
        if (!defines._arePrePassDirty) {
            return;
        }

        const configuration = MaterialHelperGeometryRendering._Configurations[renderPassId];
        if (!configuration) {
            return;
        }

        defines["PREPASS"] = true;
        defines["PREPASS_COLOR"] = false;
        defines["PREPASS_COLOR_INDEX"] = -1;

        let numMRT = 0;

        for (let i = 0; i < MaterialHelperGeometryRendering.GeometryTextureDescriptions.length; i++) {
            const geometryTextureDescription = MaterialHelperGeometryRendering.GeometryTextureDescriptions[i];
            const defineName = geometryTextureDescription.define;
            const defineIndex = geometryTextureDescription.defineIndex;
            const index = configuration.defines[defineIndex];

            if (index !== undefined) {
                defines[defineName] = true;
                defines[defineIndex] = index;
                numMRT++;
            } else {
                defines[defineName] = false;
                delete defines[defineIndex];
            }
        }

        defines["SCENE_MRT_COUNT"] = numMRT;

        defines["BONES_VELOCITY_ENABLED"] =
            mesh.useBones && mesh.computeBonesUsingShaders && mesh.skeleton && !mesh.skeleton.isUsingTextureForMatrices && configuration.excludedSkinnedMesh.indexOf(mesh) === -1;
    }

    /**
     * Binds geometry rendering data for a mesh.
     * @param renderPassId The render pass id the geometry rendering data is bound for.
     * @param effect The effect to bind the geometry rendering data to.
     * @param mesh The mesh to bind the geometry rendering data for.
     * @param world The world matrix of the mesh.
     */
    public static Bind(renderPassId: number, effect: Effect, mesh: Mesh, world: Matrix) {
        const configuration = MaterialHelperGeometryRendering._Configurations[renderPassId];
        if (!configuration) {
            return;
        }

        if (configuration.defines["PREPASS_VELOCITY_INDEX"] !== undefined || configuration.defines["PREPASS_VELOCITY_LINEAR_INDEX"] !== undefined) {
            if (!configuration.previousWorldMatrices[mesh.uniqueId]) {
                configuration.previousWorldMatrices[mesh.uniqueId] = world.clone();
            }

            const scene = mesh.getScene();

            if (!configuration.previousViewProjection) {
                configuration.previousViewProjection = scene.getTransformMatrix().clone();
                configuration.currentViewProjection = scene.getTransformMatrix().clone();
            }

            const engine = scene.getEngine();

            if (configuration.currentViewProjection.updateFlag !== scene.getTransformMatrix().updateFlag) {
                // First update of the prepass configuration for this rendering pass
                configuration.lastUpdateFrameId = engine.frameId;
                configuration.previousViewProjection.copyFrom(configuration.currentViewProjection);
                configuration.currentViewProjection.copyFrom(scene.getTransformMatrix());
            } else if (configuration.lastUpdateFrameId !== engine.frameId) {
                // The scene transformation did not change from the previous frame (so no camera motion), we must update previousViewProjection accordingly
                configuration.lastUpdateFrameId = engine.frameId;
                configuration.previousViewProjection.copyFrom(configuration.currentViewProjection);
            }

            effect.setMatrix("previousWorld", configuration.previousWorldMatrices[mesh.uniqueId]);
            effect.setMatrix("previousViewProjection", configuration.previousViewProjection);

            configuration.previousWorldMatrices[mesh.uniqueId] = world.clone();

            if (mesh.useBones && mesh.computeBonesUsingShaders && mesh.skeleton) {
                const skeleton = mesh.skeleton;

                if (!skeleton.isUsingTextureForMatrices || effect.getUniformIndex("boneTextureWidth") === -1) {
                    const matrices = skeleton.getTransformMatrices(mesh);

                    if (matrices) {
                        if (!configuration.previousBones[mesh.uniqueId]) {
                            configuration.previousBones[mesh.uniqueId] = matrices.slice();
                        }
                        effect.setMatrices("mPreviousBones", configuration.previousBones[mesh.uniqueId]);
                        configuration.previousBones[mesh.uniqueId].set(matrices);
                    }
                }
            }
        }
    }
}
