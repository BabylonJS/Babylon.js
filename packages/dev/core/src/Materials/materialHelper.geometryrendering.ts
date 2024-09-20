import { Constants } from "core/Engines/constants";
import type { MaterialDefines } from "core/Materials/materialDefines";
import type { Effect } from "core/Materials/effect";
import type { Mesh } from "core/Meshes/mesh";
import type { AbstractMesh } from "core/Meshes/abstractMesh";
import { Matrix } from "core/Maths/math.vector";

export const enum TextureClearType {
    Zero = 0,
    One = 1,
    MaxViewZ = 2,
}

export type GeometryRenderingConfiguration = {
    defines: { [name: string]: number };
    previousWorldMatrices: { [index: number]: Matrix };
    previousViewProjection: Matrix;
    currentViewProjection: Matrix;
    previousBones: { [index: number]: Float32Array };
    lastUpdateFrameId: number;
    excludedSkinnedMesh: AbstractMesh[];
};

export class MaterialHelperGeometryRendering {
    public static readonly GeometryTextureDescriptions = [
        {
            type: Constants.PREPASS_IRRADIANCE_TEXTURE_TYPE,
            name: "Irradiance",
            clearType: TextureClearType.Zero,
            define: "PREPASS_IRRADIANCE",
            defineIndex: "PREPASS_IRRADIANCE_INDEX",
        },
        {
            type: Constants.PREPASS_POSITION_TEXTURE_TYPE,
            name: "WorldPosition",
            clearType: TextureClearType.Zero,
            define: "PREPASS_POSITION",
            defineIndex: "PREPASS_POSITION_INDEX",
        },
        {
            type: Constants.PREPASS_VELOCITY_TEXTURE_TYPE,
            name: "Velocity",
            clearType: TextureClearType.Zero,
            define: "PREPASS_VELOCITY",
            defineIndex: "PREPASS_VELOCITY_INDEX",
        },
        {
            type: Constants.PREPASS_REFLECTIVITY_TEXTURE_TYPE,
            name: "Reflectivity",
            clearType: TextureClearType.Zero,
            define: "PREPASS_REFLECTIVITY",
            defineIndex: "PREPASS_REFLECTIVITY_INDEX",
        },
        {
            type: Constants.PREPASS_DEPTH_TEXTURE_TYPE /* this is the Z coordinate in view space */,
            name: "ViewDepth",
            clearType: TextureClearType.MaxViewZ,
            define: "PREPASS_DEPTH",
            defineIndex: "PREPASS_DEPTH_INDEX",
        },
        {
            type: Constants.PREPASS_NORMAL_TEXTURE_TYPE,
            name: "ViewNormal",
            clearType: TextureClearType.Zero,
            define: "PREPASS_NORMAL",
            defineIndex: "PREPASS_NORMAL_INDEX",
        },
        {
            type: Constants.PREPASS_ALBEDO_SQRT_TEXTURE_TYPE,
            name: "AlbedoSqrt",
            clearType: TextureClearType.Zero,
            define: "PREPASS_ALBEDO_SQRT",
            defineIndex: "PREPASS_ALBEDO_SQRT_INDEX",
        },
        {
            type: Constants.PREPASS_WORLD_NORMAL_TEXTURE_TYPE,
            name: "WorldNormal",
            clearType: TextureClearType.Zero,
            define: "PREPASS_WORLD_NORMAL",
            defineIndex: "PREPASS_WORLD_NORMAL_INDEX",
        },
        {
            type: Constants.PREPASS_LOCAL_POSITION_TEXTURE_TYPE,
            name: "LocalPosition",
            clearType: TextureClearType.Zero,
            define: "PREPASS_LOCAL_POSITION",
            defineIndex: "PREPASS_LOCAL_POSITION_INDEX",
        },
        {
            type: Constants.PREPASS_SCREENSPACE_DEPTH_TEXTURE_TYPE,
            name: "ScreenDepth",
            clearType: TextureClearType.One,
            define: "PREPASS_SCREENSPACE_DEPTH",
            defineIndex: "PREPASS_SCREENSPACE_DEPTH_INDEX",
        },
        {
            type: Constants.PREPASS_VELOCITY_LINEAR_TEXTURE_TYPE,
            name: "LinearVelocity",
            clearType: TextureClearType.Zero,
            define: "PREPASS_VELOCITY_LINEAR",
            defineIndex: "PREPASS_VELOCITY_LINEAR_INDEX",
        },
        {
            type: Constants.PREPASS_ALBEDO_TEXTURE_TYPE,
            name: "Albedo",
            clearType: TextureClearType.Zero,
            define: "PREPASS_ALBEDO",
            defineIndex: "PREPASS_ALBEDO_INDEX",
        },
    ];

    private static _Configurations: { [renderPassId: number]: GeometryRenderingConfiguration } = {};

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

    public static DeleteConfiguration(renderPassId: number) {
        delete MaterialHelperGeometryRendering._Configurations[renderPassId];
    }

    public static GetConfiguration(renderPassId: number): GeometryRenderingConfiguration {
        return MaterialHelperGeometryRendering._Configurations[renderPassId];
    }

    public static AddUniformsAndSamplers(uniforms: string[], _samplers: string[]) {
        uniforms.push("previousWorld", "previousViewProjection", "mPreviousBones");
    }

    public static PrepareDefines(renderPassId: number, mesh: AbstractMesh, defines: MaterialDefines) {
        const configuration = MaterialHelperGeometryRendering._Configurations[renderPassId];
        if (!configuration) {
            defines["PREPASS"] = false;
            defines["SCENE_MRT_COUNT"] = 0;
            return;
        }

        defines["PREPASS"] = true;
        defines["PREPASS_COLOR"] = false;
        delete defines["PREPASS_COLOR_INDEX"];

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
