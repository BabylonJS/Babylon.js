import type { Effect } from "core/Materials/effect";
import type { ThinEngine } from "core/Engines/thinEngine";
import { VertexBuffer, Buffer } from "core/Buffers/buffer";
import type { Engine } from "core/Engines/engine";
import { Constants } from "core/Engines/constants";
import type { Nullable } from "core/types";
import type { AbstractMesh } from "core/Meshes/abstractMesh";
import { BindBonesParameters, BindMorphTargetParameters, PrepareAttributesForBakedVertexAnimation } from "core/Materials/materialHelper.functions";
import type { Mesh } from "core/Meshes/mesh";
import type { IBoundingInfoHelperPlatform } from "./IBoundingInfoHelperPlatform";
import { extractMinAndMax } from "core/Maths/math.functions";
import { Vector3 } from "core/Maths/math.vector";

import "../../Shaders/gpuTransform.vertex";
import "../../Shaders/gpuTransform.fragment";

/** @internal */
export class TransformFeedbackBoundingHelper implements IBoundingInfoHelperPlatform {
    private static _Min = new Vector3();
    private static _Max = new Vector3();

    private _engine: Nullable<ThinEngine>;
    private _buffers: { [key: number]: Buffer } = {};
    private _effects: { [key: string]: Effect } = {};
    private _meshList: AbstractMesh[];
    private _meshListCounter = 0;

    /**
     * Creates a new TransformFeedbackBoundingHelper
     * @param engine defines the engine to use
     */
    constructor(engine: ThinEngine) {
        this._engine = engine;
    }

    /** @internal */
    public processAsync(meshes: AbstractMesh | AbstractMesh[]): Promise<void> {
        if (!Array.isArray(meshes)) {
            meshes = [meshes];
        }

        this._meshListCounter = 0;

        this._processMeshList(meshes);

        return Promise.resolve();
    }

    private _processMeshList(meshes: AbstractMesh[]) {
        const parallelShaderCompile = this._engine!.getCaps().parallelShaderCompile;

        this._engine!.getCaps().parallelShaderCompile = undefined;

        for (let i = 0; i < meshes.length; ++i) {
            const mesh = meshes[i];
            const vertexCount = mesh.getTotalVertices();

            if (vertexCount === 0 || !(mesh as Mesh).getVertexBuffer || !(mesh as Mesh).getVertexBuffer(VertexBuffer.PositionKind)) {
                continue;
            }

            // Get correct effect
            let computeEffect: Effect;
            let numInfluencers = 0;
            const defines: string[] = [];
            let uniforms: string[] = [];
            const attribs = [VertexBuffer.PositionKind];
            const samplers: string[] = [];

            // Bones
            if (mesh && mesh.useBones && mesh.computeBonesUsingShaders && mesh.skeleton) {
                attribs.push(VertexBuffer.MatricesIndicesKind);
                attribs.push(VertexBuffer.MatricesWeightsKind);
                if (mesh.numBoneInfluencers > 4) {
                    attribs.push(VertexBuffer.MatricesIndicesExtraKind);
                    attribs.push(VertexBuffer.MatricesWeightsExtraKind);
                }

                const skeleton = mesh.skeleton;

                defines.push("#define NUM_BONE_INFLUENCERS " + mesh.numBoneInfluencers);

                if (skeleton.isUsingTextureForMatrices) {
                    defines.push("#define BONETEXTURE");

                    if (uniforms.indexOf("boneTextureWidth") === -1) {
                        uniforms.push("boneTextureWidth");
                    }

                    if (samplers.indexOf("boneSampler") === -1) {
                        samplers.push("boneSampler");
                    }
                } else {
                    defines.push("#define BonesPerMesh " + (skeleton.bones.length + 1));

                    if (uniforms.indexOf("mBones") === -1) {
                        uniforms.push("mBones");
                    }
                }
            } else {
                defines.push("#define NUM_BONE_INFLUENCERS 0");
            }

            // Morph
            const manager = mesh ? (<Mesh>mesh).morphTargetManager : null;
            if (manager) {
                numInfluencers = manager.numMaxInfluencers || manager.numInfluencers;
                if (numInfluencers > 0) {
                    defines.push("#define MORPHTARGETS");
                    defines.push("#define MORPHTARGETS_POSITION");
                }
                if (manager.isUsingTextureForTargets) {
                    defines.push("#define MORPHTARGETS_TEXTURE");

                    if (uniforms.indexOf("morphTargetTextureIndices") === -1) {
                        uniforms.push("morphTargetTextureIndices");
                    }

                    if (samplers.indexOf("morphTargets") === -1) {
                        samplers.push("morphTargets");
                    }
                }
                defines.push("#define NUM_MORPH_INFLUENCERS " + numInfluencers);
                for (let index = 0; index < numInfluencers; index++) {
                    attribs.push(VertexBuffer.PositionKind + index);
                }
                if (numInfluencers > 0) {
                    uniforms = uniforms.slice();
                    uniforms.push("morphTargetInfluences");
                    uniforms.push("morphTargetCount");
                    uniforms.push("morphTargetTextureInfo");
                    uniforms.push("morphTargetTextureIndices");
                }
            }

            // Baked Vertex Animation
            const bvaManager = (<Mesh>mesh).bakedVertexAnimationManager;

            if (bvaManager && bvaManager.isEnabled) {
                defines.push("#define BAKED_VERTEX_ANIMATION_TEXTURE");
                if (uniforms.indexOf("bakedVertexAnimationSettings") === -1) {
                    uniforms.push("bakedVertexAnimationSettings");
                }
                if (uniforms.indexOf("bakedVertexAnimationTextureSizeInverted") === -1) {
                    uniforms.push("bakedVertexAnimationTextureSizeInverted");
                }
                if (uniforms.indexOf("bakedVertexAnimationTime") === -1) {
                    uniforms.push("bakedVertexAnimationTime");
                }

                if (samplers.indexOf("bakedVertexAnimationTexture") === -1) {
                    samplers.push("bakedVertexAnimationTexture");
                }
                PrepareAttributesForBakedVertexAnimation(attribs, mesh, defines);
            }

            const join = defines.join("\n");
            if (!this._effects[join]) {
                const computeEffectOptions = {
                    attributes: attribs,
                    uniformsNames: uniforms,
                    uniformBuffersNames: [],
                    samplers: samplers,
                    defines: join,
                    fallbacks: null,
                    onCompiled: null,
                    onError: null,
                    indexParameters: { maxSimultaneousMorphTargets: numInfluencers },
                    maxSimultaneousLights: 0,
                    transformFeedbackVaryings: ["outPosition"],
                };
                computeEffect = this._engine!.createEffect("gpuTransform", computeEffectOptions, this._engine!);
                this._effects[join] = computeEffect;
            } else {
                computeEffect = this._effects[join];
            }

            this._compute(mesh, computeEffect);
        }

        this._engine!.getCaps().parallelShaderCompile = parallelShaderCompile;
    }

    private _compute(mesh: AbstractMesh, effect: Effect): void {
        const engine = this._engine as Engine;

        // Buffer
        let targetBuffer: Buffer;
        const vertexCount = mesh.getTotalVertices();

        if (!this._buffers[mesh.uniqueId]) {
            const targetData = new Float32Array(vertexCount * 3);
            targetBuffer = new Buffer(mesh.getEngine(), targetData, true, 3);
            this._buffers[mesh.uniqueId] = targetBuffer;
        } else {
            targetBuffer = this._buffers[mesh.uniqueId];
        }

        // Bind
        effect.getEngine().enableEffect(effect);
        (mesh as Mesh)._bindDirect(effect, null, true);

        // Bones
        BindBonesParameters(mesh, effect);

        // Morph targets
        BindMorphTargetParameters(mesh, effect);
        if (mesh.morphTargetManager && mesh.morphTargetManager.isUsingTextureForTargets) {
            mesh.morphTargetManager._bind(effect);
        }

        // BVA
        const bvaManager = (<Mesh>mesh).bakedVertexAnimationManager;

        if (bvaManager && bvaManager.isEnabled) {
            mesh.bakedVertexAnimationManager?.bind(effect, false);
        }

        // Update
        const arrayBuffer = targetBuffer.getData()! as Float32Array;
        engine.bindTransformFeedbackBuffer(targetBuffer.getBuffer());
        engine.setRasterizerState(false);
        engine.beginTransformFeedback(true);
        engine.drawArraysType(Constants.MATERIAL_PointFillMode, 0, vertexCount);
        engine.endTransformFeedback();
        engine.setRasterizerState(true);
        engine.readTransformFeedbackBuffer(arrayBuffer);
        engine.bindTransformFeedbackBuffer(null);

        // Update mesh
        if (this._meshListCounter === 0) {
            mesh._refreshBoundingInfo(arrayBuffer, null);
        } else {
            const bb = mesh.getBoundingInfo().boundingBox;
            const extend = extractMinAndMax(arrayBuffer, 0, vertexCount);

            TransformFeedbackBoundingHelper._Min.copyFrom(bb.minimum).minimizeInPlace(extend.minimum);
            TransformFeedbackBoundingHelper._Max.copyFrom(bb.maximum).maximizeInPlace(extend.maximum);

            mesh._refreshBoundingInfoDirect({ minimum: TransformFeedbackBoundingHelper._Min, maximum: TransformFeedbackBoundingHelper._Max });
        }
    }

    /** @internal */
    public registerMeshListAsync(meshes: AbstractMesh | AbstractMesh[]): Promise<void> {
        if (!Array.isArray(meshes)) {
            meshes = [meshes];
        }

        this._meshList = meshes;
        this._meshListCounter = 0;

        return Promise.resolve();
    }

    /** @internal */
    public processMeshList(): void {
        if (this._meshList.length === 0) {
            return;
        }

        this._processMeshList(this._meshList);
        this._meshListCounter++;
    }

    /** @internal */
    public fetchResultsForMeshListAsync(): Promise<void> {
        this._meshListCounter = 0;

        return Promise.resolve();
    }

    /** @internal */
    public dispose(): void {
        for (const key in this._buffers) {
            this._buffers[key].dispose();
        }
        this._buffers = {};
        this._effects = {};
        this._engine = null;
    }
}
