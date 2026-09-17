import { type MaterialDefines, type Effect, type Mesh, type AbstractMesh, type Material, type AbstractEngine } from "core/index";
import { Constants } from "core/Engines/constants";
import { Matrix } from "core/Maths/math.vector.pure";

/**
 * Provides the object ID written by geometry rendering for a mesh.
 *
 * IDs must be unsigned integers supported by the object ID texture format. ID 0 is reserved for background or excluded meshes.
 * RGBA textures support IDs up to 0xFFFFFF, while RED textures support IDs up to 0xFF.
 * Instances and thin instances use the source mesh ID, and this callback receives the source mesh for instanced draws.
 * This callback runs in the render hot path and may be called multiple times for the same mesh in a frame.
 * It should avoid allocations and return a consistent value for a mesh during a render.
 */
export type GeometryRenderingObjectIdProvider = (mesh: AbstractMesh) => number;

/**
 * Provides the packed mesh-blending tag written by geometry rendering for a mesh.
 *
 * Tags must be 0 or contain a group ID between 1 and 63 in their low six bits. Tag 0 disables mesh blending.
 * Instances and thin instances use the source mesh tag. This callback receives the source mesh for instanced draws.
 * It runs in the render hot path and should avoid allocations and return a consistent value during a render.
 */
export type GeometryRenderingMeshBlendTagProvider = (mesh: AbstractMesh) => number;

/** @internal */
export function _GetGeometryRenderingObjectId(mesh: AbstractMesh, provider: GeometryRenderingObjectIdProvider, maxObjectId = 0xffffff): number {
    const objectId = provider(mesh);

    if (!Number.isInteger(objectId) || objectId < 0 || objectId > maxObjectId) {
        throw new Error(`Invalid geometry object ID ${objectId} for mesh "${mesh.name}". Object IDs must be integers between 0 and 0x${maxObjectId.toString(16).toUpperCase()}.`);
    }

    return objectId;
}

/** @internal */
export function _GetGeometryRenderingMeshBlendTag(mesh: AbstractMesh, provider: GeometryRenderingMeshBlendTagProvider): number {
    const tag = provider(mesh);

    if (!Number.isInteger(tag) || tag < 0 || tag > 0xff || (tag !== 0 && (tag & 0x3f) === 0)) {
        throw new Error(`Invalid geometry mesh-blending tag ${tag} for mesh "${mesh.name}". Tags must be 0 or contain a group ID between 1 and 63.`);
    }

    return tag;
}

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

    /**
     * Do not clear the texture.
     */
    NoClear = 3,
}

/**
 * Configuration for geometry rendering.
 * A configuration is created for each rendering pass a geometry rendering is used in.
 */
export type GeometryRenderingConfiguration = {
    /** @internal */
    _attachments?: number[];

    /** @internal */
    _colorAttachments?: number[];

    /** @internal */
    _mrtCount?: number;

    /** @internal */
    _defines?: string;

    /** @internal */
    _currentWorldMatrices?: { [index: number]: Matrix };

    /** @internal */
    _worldMatrixFrameIds?: { [index: number]: number };

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

    /**
     * Whether to reverse culling for the geometry rendering (meaning, if back faces should be culled, front faces are culled instead, and the other way around).
     */
    reverseCulling: boolean;

    /**
     * Provides the object ID written for each rendered mesh.
     */
    objectIdProvider?: GeometryRenderingObjectIdProvider;

    /**
     * Whether the object ID texture uses the RED format.
     */
    objectIdIsRedFormat: boolean;

    /**
     * Provides the packed mesh-blending tag written for each rendered mesh.
     */
    meshBlendTagProvider?: GeometryRenderingMeshBlendTagProvider;
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
            type: Constants.PREPASS_IRRADIANCE_LEGACY_TEXTURE_TYPE,
            name: "IrradianceLegacy",
            clearType: GeometryRenderingTextureClearType.Zero,
            define: "PREPASS_IRRADIANCE_LEGACY",
            defineIndex: "PREPASS_IRRADIANCE_LEGACY_INDEX",
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
        {
            type: Constants.PREPASS_NORMALIZED_VIEW_DEPTH_TEXTURE_TYPE,
            name: "NormalizedViewDepth",
            clearType: GeometryRenderingTextureClearType.One,
            define: "PREPASS_NORMALIZED_VIEW_DEPTH",
            defineIndex: "PREPASS_NORMALIZED_VIEW_DEPTH_INDEX",
        },
        {
            type: Constants.PREPASS_COLOR_TEXTURE_TYPE,
            name: "Color",
            clearType: GeometryRenderingTextureClearType.NoClear,
            define: "PREPASS_COLOR",
            defineIndex: "PREPASS_COLOR_INDEX",
        },
        {
            type: Constants.PREPASS_IRRADIANCE_TEXTURE_TYPE,
            name: "Irradiance",
            clearType: GeometryRenderingTextureClearType.Zero,
            define: "PREPASS_IRRADIANCE",
            defineIndex: "PREPASS_IRRADIANCE_INDEX",
        },
        {
            type: Constants.PREPASS_OBJECT_ID_TEXTURE_TYPE,
            name: "ObjectId",
            clearType: GeometryRenderingTextureClearType.Zero,
            define: "PREPASS_OBJECT_ID",
            defineIndex: "PREPASS_OBJECT_ID_INDEX",
        },
        {
            type: Constants.PREPASS_MESH_BLEND_TAG_TEXTURE_TYPE,
            name: "MeshBlendTag",
            clearType: GeometryRenderingTextureClearType.Zero,
            define: "PREPASS_MESH_BLEND_TAG",
            defineIndex: "PREPASS_MESH_BLEND_TAG_INDEX",
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
            reverseCulling: false,
            objectIdIsRedFormat: false,
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

    /** @internal */
    public static _PrepareConfiguration(renderPassId: number, attachments: number[], colorAttachments: number[]): void {
        const configuration = MaterialHelperGeometryRendering._Configurations[renderPassId];
        configuration._attachments = attachments;
        configuration._colorAttachments = colorAttachments;
        configuration._mrtCount = attachments.length;

        let defines = "#define PREPASS\n";
        for (const description of MaterialHelperGeometryRendering.GeometryTextureDescriptions) {
            const index = configuration.defines[description.defineIndex];
            if (index !== undefined) {
                defines += `#define ${description.define}\n#define ${description.defineIndex} ${index}\n`;
            }
        }
        if (configuration.objectIdIsRedFormat) {
            defines += "#define PREPASS_OBJECT_ID_R8\n";
        }
        configuration._defines = defines + `#define SCENE_MRT_COUNT ${attachments.length}\n`;
    }

    /** @internal */
    public static _PrepareStringDefines(renderPassId: number, defines: string[]): boolean {
        const configuration = MaterialHelperGeometryRendering._Configurations[renderPassId];
        if (!configuration?._defines) {
            return false;
        }
        defines.push(configuration._defines);
        return true;
    }

    /** @internal */
    public static _BindAttachmentsForEffect(engine: AbstractEngine, effect: Pick<Effect, "_multiTarget">): boolean {
        const configuration = MaterialHelperGeometryRendering._Configurations[engine.currentRenderPassId];
        if (!configuration?._attachments) {
            return true;
        }
        engine.bindAttachments(effect._multiTarget ? configuration._attachments : configuration._colorAttachments!);
        return effect._multiTarget || configuration.defines["PREPASS_COLOR_INDEX"] !== undefined;
    }

    /** @internal */
    public static _RestoreAttachments(engine: AbstractEngine): void {
        const configuration = MaterialHelperGeometryRendering._Configurations[engine.currentRenderPassId];
        if (configuration?._colorAttachments) {
            engine.bindAttachments(configuration._colorAttachments);
        }
    }

    /** @internal */
    public static _BindColorAttachments(engine: AbstractEngine): boolean {
        const configuration = MaterialHelperGeometryRendering._Configurations[engine.currentRenderPassId];
        if (!configuration?._colorAttachments) {
            return true;
        }
        engine.bindAttachments(configuration._colorAttachments);
        return configuration.defines["PREPASS_COLOR_INDEX"] !== undefined;
    }

    /**
     * Adds uniforms and samplers for geometry rendering.
     * @param uniforms The array of uniforms to add to.
     * @param _samplers The array of samplers to add to.
     */
    public static AddUniformsAndSamplers(uniforms: string[], _samplers: string[]) {
        uniforms.push("previousWorld", "previousViewProjection", "mPreviousBones", "objectId", "meshBlendTag");
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

        defines["PREPASS_OBJECT_ID_R8"] = configuration.objectIdIsRedFormat;
        defines["SCENE_MRT_COUNT"] = configuration._mrtCount ?? numMRT;

        defines["BONES_VELOCITY_ENABLED"] =
            mesh.useBones && mesh.computeBonesUsingShaders && mesh.skeleton && !mesh.skeleton.isUsingTextureForMatrices && configuration.excludedSkinnedMesh.indexOf(mesh) === -1;
    }

    /**
     * Binds geometry rendering data for a mesh.
     * @param renderPassId The render pass id the geometry rendering data is bound for.
     * @param effect The effect to bind the geometry rendering data to.
     * @param mesh The mesh to bind the geometry rendering data for.
     * @param world The world matrix of the mesh.
     * @param material The material of the mesh.
     */
    public static Bind(renderPassId: number, effect: Effect, mesh: Mesh, world: Matrix, material: Material) {
        const configuration = MaterialHelperGeometryRendering._Configurations[renderPassId];
        if (!configuration) {
            return;
        }

        const scene = mesh.getScene();
        const engine = scene.getEngine();

        if (configuration.reverseCulling) {
            engine.setStateCullFaceType(scene._mirroredCameraPosition ? material.cullBackFaces : !material.cullBackFaces);
        }

        if (configuration.defines["PREPASS_OBJECT_ID_INDEX"] !== undefined) {
            const maxObjectId = configuration.objectIdIsRedFormat ? 0xff : 0xffffff;
            let objectId = mesh.uniqueId;
            if (configuration.objectIdProvider) {
                objectId = _GetGeometryRenderingObjectId(mesh, configuration.objectIdProvider, maxObjectId);
            } else if (objectId > maxObjectId) {
                throw new Error(
                    `Invalid geometry object ID ${objectId} for mesh "${mesh.name}". Object IDs must be integers between 0 and 0x${maxObjectId.toString(16).toUpperCase()}.`
                );
            }
            effect.setFloat("objectId", objectId);
        }

        if (configuration.defines["PREPASS_MESH_BLEND_TAG_INDEX"] !== undefined) {
            const meshBlendTag = configuration.meshBlendTagProvider ? _GetGeometryRenderingMeshBlendTag(mesh, configuration.meshBlendTagProvider) : mesh.meshBlendingTag;
            effect.setInt("meshBlendTag", meshBlendTag);
        }

        if (configuration.defines["PREPASS_VELOCITY_INDEX"] !== undefined || configuration.defines["PREPASS_VELOCITY_LINEAR_INDEX"] !== undefined) {
            const currentWorldMatrices = (configuration._currentWorldMatrices ??= {});
            const worldMatrixFrameIds = (configuration._worldMatrixFrameIds ??= {});
            if (!currentWorldMatrices[mesh.uniqueId]) {
                currentWorldMatrices[mesh.uniqueId] = world.clone();
                configuration.previousWorldMatrices[mesh.uniqueId] = world.clone();
            }
            if (worldMatrixFrameIds[mesh.uniqueId] !== engine.frameId) {
                configuration.previousWorldMatrices[mesh.uniqueId].copyFrom(currentWorldMatrices[mesh.uniqueId]);
                worldMatrixFrameIds[mesh.uniqueId] = engine.frameId;
            }
            currentWorldMatrices[mesh.uniqueId].copyFrom(world);

            if (configuration.lastUpdateFrameId === -1) {
                configuration.lastUpdateFrameId = engine.frameId;
                configuration.previousViewProjection.copyFrom(scene.getTransformMatrix());
                configuration.currentViewProjection.copyFrom(scene.getTransformMatrix());
            } else if (configuration.currentViewProjection.updateFlag !== scene.getTransformMatrix().updateFlag) {
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

            if (mesh.useBones && mesh.computeBonesUsingShaders && mesh.skeleton) {
                const skeleton = mesh.skeleton;

                if (!skeleton.isUsingTextureForMatrices || effect.getUniformIndex("boneTextureInfo") === -1) {
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
