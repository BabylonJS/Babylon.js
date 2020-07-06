import { Matrix } from "../Maths/math.vector";
import { VertexBuffer } from "../Meshes/buffer";
import { SubMesh } from "../Meshes/subMesh";
import { Mesh } from "../Meshes/mesh";
import { Constants } from "../Engines/constants";
import { SmartArray } from "../Misc/smartArray";
import { Texture } from "../Materials/Textures/texture";
import { MultiRenderTarget } from "../Materials/Textures/multiRenderTarget";
import { Effect } from "../Materials/effect";
import { MaterialHelper } from "../Materials/materialHelper";
import { Scene } from "../scene";
import { AbstractMesh } from "../Meshes/abstractMesh";
import { Color4 } from '../Maths/math.color';
import { StandardMaterial } from '../Materials/standardMaterial';
import { PBRMaterial } from '../Materials/PBR/pbrMaterial';

import "../Shaders/geometry.fragment";
import "../Shaders/geometry.vertex";
import { _DevTools } from '../Misc/devTools';

/** @hidden */
interface ISavedTransformationMatrix {
    world: Matrix;
    viewProjection: Matrix;
}

/**
 * This renderer is helpfull to fill one of the render target with a geometry buffer.
 */
export class GeometryBufferRenderer {
    /**
     * Constant used to retrieve the position texture index in the G-Buffer textures array
     * using getIndex(GeometryBufferRenderer.POSITION_TEXTURE_INDEX)
     */
    public static readonly POSITION_TEXTURE_TYPE = 1;
    /**
     * Constant used to retrieve the velocity texture index in the G-Buffer textures array
     * using getIndex(GeometryBufferRenderer.VELOCITY_TEXTURE_INDEX)
     */
    public static readonly VELOCITY_TEXTURE_TYPE = 2;
    /**
     * Constant used to retrieve the reflectivity texture index in the G-Buffer textures array
     * using the getIndex(GeometryBufferRenderer.REFLECTIVITY_TEXTURE_TYPE)
     */
    public static readonly REFLECTIVITY_TEXTURE_TYPE = 3;

    /**
     * Dictionary used to store the previous transformation matrices of each rendered mesh
     * in order to compute objects velocities when enableVelocity is set to "true"
     * @hidden
     */
    public _previousTransformationMatrices: { [index: number]: ISavedTransformationMatrix } = {};
    /**
     * Dictionary used to store the previous bones transformation matrices of each rendered mesh
     * in order to compute objects velocities when enableVelocity is set to "true"
     * @hidden
     */
    public _previousBonesTransformationMatrices: { [index: number]: Float32Array } = {};
    /**
     * Array used to store the ignored skinned meshes while computing velocity map (typically used by the motion blur post-process).
     * Avoids computing bones velocities and computes only mesh's velocity itself (position, rotation, scaling).
     */
    public excludedSkinnedMeshesFromVelocity: AbstractMesh[] = [];

    /** Gets or sets a boolean indicating if transparent meshes should be rendered */
    public renderTransparentMeshes = true;

    private _scene: Scene;
    private _multiRenderTarget: MultiRenderTarget;
    private _ratio: number;
    private _enablePosition: boolean = false;
    private _enableVelocity: boolean = false;
    private _enableReflectivity: boolean = false;

    private _positionIndex: number = -1;
    private _velocityIndex: number = -1;
    private _reflectivityIndex: number = -1;

    protected _effect: Effect;
    protected _cachedDefines: string;

    /**
     * Set the render list (meshes to be rendered) used in the G buffer.
     */
    public set renderList(meshes: Mesh[]) {
        this._multiRenderTarget.renderList = meshes;
    }

    /**
     * Gets wether or not G buffer are supported by the running hardware.
     * This requires draw buffer supports
     */
    public get isSupported(): boolean {
        return this._multiRenderTarget.isSupported;
    }

    /**
     * Returns the index of the given texture type in the G-Buffer textures array
     * @param textureType The texture type constant. For example GeometryBufferRenderer.POSITION_TEXTURE_INDEX
     * @returns the index of the given texture type in the G-Buffer textures array
     */
    public getTextureIndex(textureType: number): number {
        switch (textureType) {
            case GeometryBufferRenderer.POSITION_TEXTURE_TYPE: return this._positionIndex;
            case GeometryBufferRenderer.VELOCITY_TEXTURE_TYPE: return this._velocityIndex;
            case GeometryBufferRenderer.REFLECTIVITY_TEXTURE_TYPE: return this._reflectivityIndex;
            default: return -1;
        }
    }

    /**
     * Gets a boolean indicating if objects positions are enabled for the G buffer.
     */
    public get enablePosition(): boolean {
        return this._enablePosition;
    }

    /**
     * Sets whether or not objects positions are enabled for the G buffer.
     */
    public set enablePosition(enable: boolean) {
        this._enablePosition = enable;
        this.dispose();
        this._createRenderTargets();
    }

    /**
     * Gets a boolean indicating if objects velocities are enabled for the G buffer.
     */
    public get enableVelocity(): boolean {
        return this._enableVelocity;
    }

    /**
     * Sets wether or not objects velocities are enabled for the G buffer.
     */
    public set enableVelocity(enable: boolean) {
        this._enableVelocity = enable;

        if (!enable) {
            this._previousTransformationMatrices = {};
        }

        this.dispose();
        this._createRenderTargets();
    }

    /**
     * Gets a boolean indicating if objects roughness are enabled in the G buffer.
     */
    public get enableReflectivity(): boolean {
        return this._enableReflectivity;
    }

    /**
     * Sets wether or not objects roughness are enabled for the G buffer.
     */
    public set enableReflectivity(enable: boolean) {
        this._enableReflectivity = enable;
        this.dispose();
        this._createRenderTargets();
    }

    /**
     * Gets the scene associated with the buffer.
     */
    public get scene(): Scene {
        return this._scene;
    }

    /**
     * Gets the ratio used by the buffer during its creation.
     * How big is the buffer related to the main canvas.
     */
    public get ratio(): number {
        return this._ratio;
    }

    /** @hidden */
    public static _SceneComponentInitialization: (scene: Scene) => void = (_) => {
        throw _DevTools.WarnImport("GeometryBufferRendererSceneComponent");
    }

    /**
     * Creates a new G Buffer for the scene
     * @param scene The scene the buffer belongs to
     * @param ratio How big is the buffer related to the main canvas.
     */
    constructor(scene: Scene, ratio: number = 1) {
        this._scene = scene;
        this._ratio = ratio;

        GeometryBufferRenderer._SceneComponentInitialization(this._scene);

        // Render target
        this._createRenderTargets();
    }

    /**
     * Checks wether everything is ready to render a submesh to the G buffer.
     * @param subMesh the submesh to check readiness for
     * @param useInstances is the mesh drawn using instance or not
     * @returns true if ready otherwise false
     */
    public isReady(subMesh: SubMesh, useInstances: boolean): boolean {
        var material = <any> subMesh.getMaterial();

        if (material && material.disableDepthWrite) {
            return false;
        }

        var defines = [];
        var attribs = [VertexBuffer.PositionKind, VertexBuffer.NormalKind];
        var mesh = subMesh.getMesh();

        // Alpha test
        if (material) {
            let needUv = false;
            if (material.needAlphaTesting()) {
                defines.push("#define ALPHATEST");
                needUv = true;
            }

            if (material.bumpTexture && StandardMaterial.BumpTextureEnabled) {
                defines.push("#define BUMP");
                defines.push("#define BUMPDIRECTUV 0");
                needUv = true;
            }

            if (this._enableReflectivity) {
                if (material instanceof StandardMaterial && material.specularTexture) {
                    defines.push("#define HAS_SPECULAR");
                    needUv = true;
                } else if (material instanceof PBRMaterial && material.reflectivityTexture) {
                    defines.push("#define HAS_REFLECTIVITY");
                    needUv = true;
                }
            }

            if (needUv) {
                defines.push("#define NEED_UV");
                if (mesh.isVerticesDataPresent(VertexBuffer.UVKind)) {
                    attribs.push(VertexBuffer.UVKind);
                    defines.push("#define UV1");
                }
                if (mesh.isVerticesDataPresent(VertexBuffer.UV2Kind)) {
                    attribs.push(VertexBuffer.UV2Kind);
                    defines.push("#define UV2");
                }
            }
        }

        // Buffers
        if (this._enablePosition) {
            defines.push("#define POSITION");
            defines.push("#define POSITION_INDEX " + this._positionIndex);
        }

        if (this._enableVelocity) {
            defines.push("#define VELOCITY");
            defines.push("#define VELOCITY_INDEX " + this._velocityIndex);
            if (this.excludedSkinnedMeshesFromVelocity.indexOf(mesh) === -1) {
                defines.push("#define BONES_VELOCITY_ENABLED");
            }
        }

        if (this._enableReflectivity) {
            defines.push("#define REFLECTIVITY");
            defines.push("#define REFLECTIVITY_INDEX " + this._reflectivityIndex);
        }

        // Bones
        if (mesh.useBones && mesh.computeBonesUsingShaders) {
            attribs.push(VertexBuffer.MatricesIndicesKind);
            attribs.push(VertexBuffer.MatricesWeightsKind);
            if (mesh.numBoneInfluencers > 4) {
                attribs.push(VertexBuffer.MatricesIndicesExtraKind);
                attribs.push(VertexBuffer.MatricesWeightsExtraKind);
            }
            defines.push("#define NUM_BONE_INFLUENCERS " + mesh.numBoneInfluencers);
            defines.push("#define BonesPerMesh " + (mesh.skeleton ? mesh.skeleton.bones.length + 1 : 0));
        } else {
            defines.push("#define NUM_BONE_INFLUENCERS 0");
        }

        // Morph targets
        const morphTargetManager = (mesh as Mesh).morphTargetManager;
        let numMorphInfluencers = 0;
        if (morphTargetManager) {
            if (morphTargetManager.numInfluencers > 0) {
                numMorphInfluencers = morphTargetManager.numInfluencers;

                defines.push("#define MORPHTARGETS");
                defines.push("#define NUM_MORPH_INFLUENCERS " + numMorphInfluencers);

                MaterialHelper.PrepareAttributesForMorphTargetsInfluencers(attribs, mesh, numMorphInfluencers);
            }
        }

        // Instances
        if (useInstances) {
            defines.push("#define INSTANCES");
            MaterialHelper.PushAttributesForInstances(attribs);
            if (subMesh.getRenderingMesh().hasThinInstances) {
                defines.push("#define THIN_INSTANCES");
            }
        }

        // Setup textures count
        defines.push("#define RENDER_TARGET_COUNT " + this._multiRenderTarget.textures.length);

        // Get correct effect
        var join = defines.join("\n");
        if (this._cachedDefines !== join) {
            this._cachedDefines = join;
            this._effect = this._scene.getEngine().createEffect("geometry",
                attribs,
                [
                    "world", "mBones", "viewProjection", "diffuseMatrix", "view", "previousWorld", "previousViewProjection", "mPreviousBones",
                    "morphTargetInfluences", "bumpMatrix", "reflectivityMatrix", "vTangentSpaceParams", "vBumpInfos"
                ],
                ["diffuseSampler", "bumpSampler", "reflectivitySampler"], join,
                undefined, undefined, undefined,
                { buffersCount: this._multiRenderTarget.textures.length - 1, maxSimultaneousMorphTargets: numMorphInfluencers });
        }

        return this._effect.isReady();
    }

    /**
     * Gets the current underlying G Buffer.
     * @returns the buffer
     */
    public getGBuffer(): MultiRenderTarget {
        return this._multiRenderTarget;
    }

    /**
     * Gets the number of samples used to render the buffer (anti aliasing).
     */
    public get samples(): number {
        return this._multiRenderTarget.samples;
    }

    /**
     * Sets the number of samples used to render the buffer (anti aliasing).
     */
    public set samples(value: number) {
        this._multiRenderTarget.samples = value;
    }

    /**
     * Disposes the renderer and frees up associated resources.
     */
    public dispose(): void {
        this.getGBuffer().dispose();
    }

    protected _createRenderTargets(): void {
        var engine = this._scene.getEngine();
        var count = 2;

        if (this._enablePosition) {
            this._positionIndex = count;
            count++;
        }

        if (this._enableVelocity) {
            this._velocityIndex = count;
            count++;
        }

        if (this._enableReflectivity) {
            this._reflectivityIndex = count;
            count++;
        }

        this._multiRenderTarget = new MultiRenderTarget("gBuffer",
            { width: engine.getRenderWidth() * this._ratio, height: engine.getRenderHeight() * this._ratio }, count, this._scene,
            { generateMipMaps: false, generateDepthTexture: true, defaultType: Constants.TEXTURETYPE_FLOAT });
        if (!this.isSupported) {
            return;
        }
        this._multiRenderTarget.wrapU = Texture.CLAMP_ADDRESSMODE;
        this._multiRenderTarget.wrapV = Texture.CLAMP_ADDRESSMODE;
        this._multiRenderTarget.refreshRate = 1;
        this._multiRenderTarget.renderParticles = false;
        this._multiRenderTarget.renderList = null;

        // set default depth value to 1.0 (far away)
        this._multiRenderTarget.onClearObservable.add((engine) => {
            engine.clear(new Color4(0.0, 0.0, 0.0, 1.0), true, true, true);
        });

        // Custom render function
        var renderSubMesh = (subMesh: SubMesh): void => {
            var renderingMesh = subMesh.getRenderingMesh();
            var effectiveMesh = subMesh.getEffectiveMesh();
            var scene = this._scene;
            var engine = scene.getEngine();
            let material = <any> subMesh.getMaterial();

            if (!material) {
                return;
            }

            effectiveMesh._internalAbstractMeshDataInfo._isActiveIntermediate = false;

            // Velocity
            if (this._enableVelocity && !this._previousTransformationMatrices[effectiveMesh.uniqueId]) {
                this._previousTransformationMatrices[effectiveMesh.uniqueId] = {
                    world: Matrix.Identity(),
                    viewProjection: scene.getTransformMatrix()
                };

                if (renderingMesh.skeleton) {
                    const bonesTransformations = renderingMesh.skeleton.getTransformMatrices(renderingMesh);
                    this._previousBonesTransformationMatrices[renderingMesh.uniqueId] = this._copyBonesTransformationMatrices(bonesTransformations, new Float32Array(bonesTransformations.length));
                }
            }

            // Culling
            engine.setState(material.backFaceCulling, 0, false, scene.useRightHandedSystem);

            // Managing instances
            var batch = renderingMesh._getInstancesRenderList(subMesh._id, !!subMesh.getReplacementMesh());

            if (batch.mustReturn) {
                return;
            }

            var hardwareInstancedRendering = (engine.getCaps().instancedArrays) && (batch.visibleInstances[subMesh._id] !== null || renderingMesh.hasThinInstances);
            var world = effectiveMesh.getWorldMatrix();

            if (this.isReady(subMesh, hardwareInstancedRendering)) {
                engine.enableEffect(this._effect);
                renderingMesh._bind(subMesh, this._effect, material.fillMode);

                this._effect.setMatrix("viewProjection", scene.getTransformMatrix());
                this._effect.setMatrix("view", scene.getViewMatrix());

                if (material) {
                    // Alpha test
                    if (material.needAlphaTesting()) {
                        var alphaTexture = material.getAlphaTestTexture();
                        if (alphaTexture) {
                            this._effect.setTexture("diffuseSampler", alphaTexture);
                            this._effect.setMatrix("diffuseMatrix", alphaTexture.getTextureMatrix());
                        }
                    }

                    // Bump
                    if (material.bumpTexture && scene.getEngine().getCaps().standardDerivatives && StandardMaterial.BumpTextureEnabled) {
                        this._effect.setFloat3("vBumpInfos", material.bumpTexture.coordinatesIndex, 1.0 / material.bumpTexture.level, material.parallaxScaleBias);
                        this._effect.setMatrix("bumpMatrix", material.bumpTexture.getTextureMatrix());
                        this._effect.setTexture("bumpSampler", material.bumpTexture);
                        this._effect.setFloat2("vTangentSpaceParams", material.invertNormalMapX ? -1.0 : 1.0, material.invertNormalMapY ? -1.0 : 1.0);
                    }

                    // Roughness
                    if (this._enableReflectivity) {
                        if (material instanceof StandardMaterial && material.specularTexture) {
                            this._effect.setMatrix("reflectivityMatrix", material.specularTexture.getTextureMatrix());
                            this._effect.setTexture("reflectivitySampler", material.specularTexture);
                        } else if (material instanceof PBRMaterial && material.reflectivityTexture) {
                            this._effect.setMatrix("reflectivityMatrix", material.reflectivityTexture.getTextureMatrix());
                            this._effect.setTexture("reflectivitySampler", material.reflectivityTexture);
                        }
                    }
                }

                // Bones
                if (renderingMesh.useBones && renderingMesh.computeBonesUsingShaders && renderingMesh.skeleton) {
                    this._effect.setMatrices("mBones", renderingMesh.skeleton.getTransformMatrices(renderingMesh));
                    if (this._enableVelocity) {
                        this._effect.setMatrices("mPreviousBones", this._previousBonesTransformationMatrices[renderingMesh.uniqueId]);
                    }
                }

                // Morph targets
                MaterialHelper.BindMorphTargetParameters(renderingMesh, this._effect);

                // Velocity
                if (this._enableVelocity) {
                    this._effect.setMatrix("previousWorld", this._previousTransformationMatrices[effectiveMesh.uniqueId].world);
                    this._effect.setMatrix("previousViewProjection", this._previousTransformationMatrices[effectiveMesh.uniqueId].viewProjection);
                }

                // Draw
                renderingMesh._processRendering(effectiveMesh, subMesh, this._effect, material.fillMode, batch, hardwareInstancedRendering,
                    (isInstance, w) => this._effect.setMatrix("world", w));
            }

            // Velocity
            if (this._enableVelocity) {
                this._previousTransformationMatrices[effectiveMesh.uniqueId].world = world.clone();
                this._previousTransformationMatrices[effectiveMesh.uniqueId].viewProjection = this._scene.getTransformMatrix().clone();
                if (renderingMesh.skeleton) {
                    this._copyBonesTransformationMatrices(renderingMesh.skeleton.getTransformMatrices(renderingMesh), this._previousBonesTransformationMatrices[effectiveMesh.uniqueId]);
                }
            }
        };

        this._multiRenderTarget.customRenderFunction = (opaqueSubMeshes: SmartArray<SubMesh>, alphaTestSubMeshes: SmartArray<SubMesh>, transparentSubMeshes: SmartArray<SubMesh>, depthOnlySubMeshes: SmartArray<SubMesh>): void => {
            var index;

            if (depthOnlySubMeshes.length) {
                engine.setColorWrite(false);
                for (index = 0; index < depthOnlySubMeshes.length; index++) {
                    renderSubMesh(depthOnlySubMeshes.data[index]);
                }
                engine.setColorWrite(true);
            }

            for (index = 0; index < opaqueSubMeshes.length; index++) {
                renderSubMesh(opaqueSubMeshes.data[index]);
            }

            for (index = 0; index < alphaTestSubMeshes.length; index++) {
                renderSubMesh(alphaTestSubMeshes.data[index]);
            }

            if (this.renderTransparentMeshes) {
                for (index = 0; index < transparentSubMeshes.length; index++) {
                    renderSubMesh(transparentSubMeshes.data[index]);
                }
            }
        };
    }

    // Copies the bones transformation matrices into the target array and returns the target's reference
    private _copyBonesTransformationMatrices(source: Float32Array, target: Float32Array): Float32Array {
        for (let i = 0; i < source.length; i++) {
            target[i] = source[i];
        }

        return target;
    }
}
