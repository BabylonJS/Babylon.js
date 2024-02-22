import { Logger } from "../Misc/logger";
import type { Camera } from "../Cameras/camera";
import type { Scene } from "../scene";
import type { Effect } from "./effect";
import type { AbstractMesh } from "../Meshes/abstractMesh";
import { SceneConstants } from "../scene.constants";
import { Constants } from "../Engines/constants";
import { Color3 } from "../Maths/math.color";
import { EngineStore } from "../Engines/engineStore";
import type { Mesh } from "../Meshes/mesh";
import { BufferConstants } from "../Buffers/buffer.constants";

// Temps
const _TempFogColor = Color3.Black();
const _TmpMorphInfluencers = { NUM_MORPH_INFLUENCERS: 0 };

/**
 * Binds the logarithmic depth information from the scene to the effect for the given defines.
 * @param defines The generated defines used in the effect
 * @param effect The effect we are binding the data to
 * @param scene The scene we are willing to render with logarithmic scale for
 */
export function BindLogDepth(defines: any, effect: Effect, scene: Scene): void {
    if (!defines || defines["LOGARITHMICDEPTH"] || (defines.indexOf && defines.indexOf("LOGARITHMICDEPTH") >= 0)) {
        const camera = scene.activeCamera as Camera;
        if (camera.mode === Constants.ORTHOGRAPHIC_CAMERA) {
            Logger.Error("Logarithmic depth is not compatible with orthographic cameras!", 20);
        }
        effect.setFloat("logarithmicDepthConstant", 2.0 / (Math.log(camera.maxZ + 1.0) / Math.LN2));
    }
}

/**
 * Binds the fog information from the scene to the effect for the given mesh.
 * @param scene The scene the lights belongs to
 * @param mesh The mesh we are binding the information to render
 * @param effect The effect we are binding the data to
 * @param linearSpace Defines if the fog effect is applied in linear space
 */
export function BindFogParameters(scene: Scene, mesh?: AbstractMesh, effect?: Effect, linearSpace = false): void {
    if (effect && scene.fogEnabled && (!mesh || mesh.applyFog) && scene.fogMode !== SceneConstants.FOGMODE_NONE) {
        effect.setFloat4("vFogInfos", scene.fogMode, scene.fogStart, scene.fogEnd, scene.fogDensity);
        // Convert fog color to linear space if used in a linear space computed shader.
        if (linearSpace) {
            scene.fogColor.toLinearSpaceToRef(_TempFogColor, scene.getEngine().useExactSrgbConversions);
            effect.setColor3("vFogColor", _TempFogColor);
        } else {
            effect.setColor3("vFogColor", scene.fogColor);
        }
    }
}

/**
 * Prepares the list of attributes required for morph targets according to the effect defines.
 * @param attribs The current list of supported attribs
 * @param mesh The mesh to prepare the morph targets attributes for
 * @param influencers The number of influencers
 */
export function PrepareAttributesForMorphTargetsInfluencers(attribs: string[], mesh: AbstractMesh, influencers: number): void {
    _TmpMorphInfluencers.NUM_MORPH_INFLUENCERS = influencers;
    PrepareAttributesForMorphTargets(attribs, mesh, _TmpMorphInfluencers);
}

/**
 * Prepares the list of attributes required for morph targets according to the effect defines.
 * @param attribs The current list of supported attribs
 * @param mesh The mesh to prepare the morph targets attributes for
 * @param defines The current Defines of the effect
 */
export function PrepareAttributesForMorphTargets(attribs: string[], mesh: AbstractMesh, defines: any): void {
    const influencers = defines["NUM_MORPH_INFLUENCERS"];

    if (influencers > 0 && EngineStore.LastCreatedEngine) {
        const maxAttributesCount = EngineStore.LastCreatedEngine.getCaps().maxVertexAttribs;
        const manager = (mesh as Mesh).morphTargetManager;
        if (manager?.isUsingTextureForTargets) {
            return;
        }
        const normal = manager && manager.supportsNormals && defines["NORMAL"];
        const tangent = manager && manager.supportsTangents && defines["TANGENT"];
        const uv = manager && manager.supportsUVs && defines["UV1"];
        for (let index = 0; index < influencers; index++) {
            attribs.push(BufferConstants.PositionKind + index);

            if (normal) {
                attribs.push(BufferConstants.NormalKind + index);
            }

            if (tangent) {
                attribs.push(BufferConstants.TangentKind + index);
            }

            if (uv) {
                attribs.push(BufferConstants.UVKind + "_" + index);
            }

            if (attribs.length > maxAttributesCount) {
                Logger.Error("Cannot add more vertex attributes for mesh " + mesh.name);
            }
        }
    }
}

/**
 * Add the list of attributes required for instances to the attribs array.
 * @param attribs The current list of supported attribs
 * @param needsPreviousMatrices If the shader needs previous matrices
 */
export function PushAttributesForInstances(attribs: string[], needsPreviousMatrices: boolean = false): void {
    attribs.push("world0");
    attribs.push("world1");
    attribs.push("world2");
    attribs.push("world3");
    if (needsPreviousMatrices) {
        attribs.push("previousWorld0");
        attribs.push("previousWorld1");
        attribs.push("previousWorld2");
        attribs.push("previousWorld3");
    }
}

/**
 * Binds the morph targets information from the mesh to the effect.
 * @param abstractMesh The mesh we are binding the information to render
 * @param effect The effect we are binding the data to
 */
export function BindMorphTargetParameters(abstractMesh: AbstractMesh, effect: Effect): void {
    const manager = (<Mesh>abstractMesh).morphTargetManager;
    if (!abstractMesh || !manager) {
        return;
    }

    effect.setFloatArray("morphTargetInfluences", manager.influences);
}
