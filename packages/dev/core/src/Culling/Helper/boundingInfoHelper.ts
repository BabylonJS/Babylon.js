import { WebGL2BoundingHelper } from "./webgl2BoundingHelper";
import type { AbstractEngine, ThinEngine } from "core/Engines";
import type { Mesh } from "core/Meshes/mesh";
import { VertexBuffer, Buffer } from "core/Buffers/buffer";
import { BindBonesParameters, BindMorphTargetParameters, PrepareAttributesForBakedVertexAnimation } from "core/Materials/materialHelper.functions";
import type { Effect } from "core/Materials/effect";

/**
 * Utility class to help with bounding info management
 * #BCNJD4#4
 */
export class BoundingInfoHelper {
    private _platform: WebGL2BoundingHelper;

    public constructor(engine: AbstractEngine) {
        this._platform = new WebGL2BoundingHelper(engine as ThinEngine);
    }

    /**
     * Compute the bounding info of a mesh using shaders
     * @param mesh defines the mesh to update
     * @returns a promise that resolves when the bounding info is computed
     */
    public computeAsync(mesh: Mesh): Promise<void> {
        return new Promise((resolve, reject) => {
            const source = mesh.getVertexBuffer(VertexBuffer.PositionKind);

            if (!source) {
                resolve();
                return;
            }

            const vertexCount = mesh.getTotalVertices();
            const targetData = new Float32Array(vertexCount * 3);
            const target = new Buffer(mesh.getEngine(), targetData, true, 3);

            // Get correct effect
            let numInfluencers = 0;
            const defines: string[] = [];
            let uniforms: string[] = ["world"];
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
            if (mesh) {
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
                }

                PrepareAttributesForBakedVertexAnimation(attribs, mesh, defines);
            }

            const effect = this._platform.createUpdateEffect(attribs, defines, uniforms, samplers, numInfluencers);

            if (effect.isReady()) {
                this._updateBuffer(mesh, effect, target, resolve);
                return;
            }

            effect.onCompileObservable.add(() => {
                this._updateBuffer(mesh, effect, target, resolve);
            });
        });
    }

    private _updateBuffer(mesh: Mesh, effect: Effect, target: Buffer, resolve: () => void): void {
        const vertexCount = mesh.getTotalVertices();
        mesh._bindDirect(effect, null, true);
        const world = mesh.getWorldMatrix();
        effect.setMatrix("world", world);

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
        //  mesh._refreshBoundingInfo(target.getData()! as Float32Array, null);

        resolve();
    }
}
