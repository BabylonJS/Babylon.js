import { WebGL2BoundingHelper } from "./webgl2BoundingHelper";
import type { Mesh } from "core/Meshes/mesh";
import { VertexBuffer, Buffer } from "core/Buffers/buffer";
import { BindBonesParameters, BindMorphTargetParameters, PrepareAttributesForBakedVertexAnimation } from "core/Materials/materialHelper.functions";
import type { Effect } from "core/Materials/effect";
import type { AbstractEngine } from "core/Engines/abstractEngine";
import type { Engine } from "core/Engines/engine";

/**
 * Utility class to help with bounding info management
 * #BCNJD4#5
 * #BCNJD4#9
 */
export class BoundingInfoHelper {
    private _platform: WebGL2BoundingHelper;
    private _buffers: { [key: number]: Buffer } = {};
    private _effects: { [key: string]: Effect } = {};

    /**
     * Creates a new BoundingInfoHelper
     * @param engine defines the engine to use
     */
    public constructor(engine: AbstractEngine) {
        if ((engine as Engine).createTransformFeedback) {
            // Go down the WebGL2 path
            this._platform = new WebGL2BoundingHelper(engine as Engine);
        }
    }

    /**
     * Compute the bounding info of a mesh using shaders
     * @param mesh defines the mesh to update
     * @returns a promise that resolves when the bounding info is computed
     */
    public computeAsync(mesh: Mesh): Promise<void> {
        return new Promise((resolve) => {
            const source = mesh.getVertexBuffer(VertexBuffer.PositionKind);

            if (!source) {
                resolve(); // Take no action if mesh has no position
                return;
            }

            const vertexCount = mesh.getTotalVertices();

            let targetBuffer: Buffer;
            if (!this._buffers[mesh.uniqueId]) {
                const targetData = new Float32Array(vertexCount * 3);
                targetBuffer = new Buffer(mesh.getEngine(), targetData, true, 3);
                this._buffers[mesh.uniqueId] = targetBuffer;
            } else {
                targetBuffer = this._buffers[mesh.uniqueId];
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
                computeEffect = this._platform.createUpdateEffect(attribs, join, uniforms, samplers, numInfluencers);
                this._effects[join] = computeEffect;
            } else {
                computeEffect = this._effects[join];
            }

            if (computeEffect.isReady()) {
                this._updateBuffer(mesh, computeEffect, targetBuffer, resolve);
                return;
            }

            computeEffect.onCompileObservable.add(() => {
                this._updateBuffer(mesh, computeEffect, targetBuffer, resolve);
            });
        });
    }

    private _updateBuffer(mesh: Mesh, effect: Effect, target: Buffer, resolve: () => void): void {
        const vertexCount = mesh.getTotalVertices();
        mesh._bindDirect(effect, null, true);

        // Bones
        BindBonesParameters(mesh, effect);

        // Morph targets
        const manager = (<Mesh>mesh).morphTargetManager;
        if (manager && manager.numInfluencers > 0) {
            BindMorphTargetParameters(<Mesh>mesh, effect);
        }

        // BVA
        const bvaManager = (<Mesh>mesh).bakedVertexAnimationManager;

        if (bvaManager && bvaManager.isEnabled) {
            mesh.bakedVertexAnimationManager?.bind(effect, false);
        }

        // Execute
        this._platform.updateBuffer(vertexCount, target);

        // Retrieve data
        mesh._refreshBoundingInfo(target.getData()! as Float32Array, null);

        resolve();
    }

    /**
     * Dispose and release associated resources
     */
    public dispose(): void {
        for (const key in this._buffers) {
            this._buffers[key].dispose();
        }
        for (const key in this._effects) {
            this._effects[key].dispose();
        }
        this._platform.dispose();
    }
}
