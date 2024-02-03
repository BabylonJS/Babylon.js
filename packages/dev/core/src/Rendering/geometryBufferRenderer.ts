import { Matrix } from "../Maths/math.vector";
import { VertexBuffer } from "../Buffers/buffer";
import type { SubMesh } from "../Meshes/subMesh";
import type { Mesh } from "../Meshes/mesh";
import { Constants } from "../Engines/constants";
import type { SmartArray } from "../Misc/smartArray";
import { Texture } from "../Materials/Textures/texture";
import type { InternalTexture } from "../Materials/Textures/internalTexture";
import { MultiRenderTarget } from "../Materials/Textures/multiRenderTarget";
import type { PrePassRenderer } from "../Rendering/prePassRenderer";
import { MaterialHelper } from "../Materials/materialHelper";
import type { Scene } from "../scene";
import type { AbstractMesh } from "../Meshes/abstractMesh";
import { Color4 } from "../Maths/math.color";
import { _WarnImport } from "../Misc/devTools";
import type { Observer } from "../Misc/observable";
import type { Engine } from "../Engines/engine";
import type { Nullable } from "../types";
import { Material } from "../Materials/material";

import "../Shaders/geometry.fragment";
import "../Shaders/geometry.vertex";
import { MaterialFlags } from "../Materials/materialFlags";
import { addClipPlaneUniforms, bindClipPlane, prepareStringDefinesForClipPlanes } from "../Materials/clipPlaneMaterialHelper";

/** @internal */
interface ISavedTransformationMatrix {
    world: Matrix;
    viewProjection: Matrix;
}

/** list the uniforms used by the geometry renderer */
const uniforms = [
    "world",
    "mBones",
    "viewProjection",
    "diffuseMatrix",
    "view",
    "previousWorld",
    "previousViewProjection",
    "mPreviousBones",
    "bumpMatrix",
    "reflectivityMatrix",
    "albedoMatrix",
    "reflectivityColor",
    "albedoColor",
    "metallic",
    "glossiness",
    "vTangentSpaceParams",
    "vBumpInfos",
    "morphTargetInfluences",
    "morphTargetCount",
    "morphTargetTextureInfo",
    "morphTargetTextureIndices",
    "boneTextureWidth",
];
addClipPlaneUniforms(uniforms);

/**
 * This renderer is helpful to fill one of the render target with a geometry buffer.
 */
export class GeometryBufferRenderer {
    /**
     * Constant used to retrieve the depth texture index in the G-Buffer textures array
     * using getIndex(GeometryBufferRenderer.DEPTH_TEXTURE_INDEX)
     */
    public static readonly DEPTH_TEXTURE_TYPE = 0;
    /**
     * Constant used to retrieve the normal texture index in the G-Buffer textures array
     * using getIndex(GeometryBufferRenderer.NORMAL_TEXTURE_INDEX)
     */
    public static readonly NORMAL_TEXTURE_TYPE = 1;
    /**
     * Constant used to retrieve the position texture index in the G-Buffer textures array
     * using getIndex(GeometryBufferRenderer.POSITION_TEXTURE_INDEX)
     */
    public static readonly POSITION_TEXTURE_TYPE = 2;
    /**
     * Constant used to retrieve the velocity texture index in the G-Buffer textures array
     * using getIndex(GeometryBufferRenderer.VELOCITY_TEXTURE_INDEX)
     */
    public static readonly VELOCITY_TEXTURE_TYPE = 3;
    /**
     * Constant used to retrieve the reflectivity texture index in the G-Buffer textures array
     * using the getIndex(GeometryBufferRenderer.REFLECTIVITY_TEXTURE_TYPE)
     */
    public static readonly REFLECTIVITY_TEXTURE_TYPE = 4;

    /**
     * Dictionary used to store the previous transformation matrices of each rendered mesh
     * in order to compute objects velocities when enableVelocity is set to "true"
     * @internal
     */
    public _previousTransformationMatrices: { [index: number]: ISavedTransformationMatrix } = {};
    /**
     * Dictionary used to store the previous bones transformation matrices of each rendered mesh
     * in order to compute objects velocities when enableVelocity is set to "true"
     * @internal
     */
    public _previousBonesTransformationMatrices: { [index: number]: Float32Array } = {};
    /**
     * Array used to store the ignored skinned meshes while computing velocity map (typically used by the motion blur post-process).
     * Avoids computing bones velocities and computes only mesh's velocity itself (position, rotation, scaling).
     */
    public excludedSkinnedMeshesFromVelocity: AbstractMesh[] = [];

    /** Gets or sets a boolean indicating if transparent meshes should be rendered */
    public renderTransparentMeshes = true;

    /**
     * Gets or sets a boolean indicating if normals should be generated in world space (default: false, meaning normals are generated in view space)
     */
    public generateNormalsInWorldSpace = false;

    private _normalsAreUnsigned = false;

    /**
     * Gets a boolean indicating if normals are encoded in the [0,1] range in the render target. If true, you should do `normal = normal_rt * 2.0 - 1.0` to get the right normal
     */
    public get normalsAreUnsigned() {
        return this._normalsAreUnsigned;
    }

    private _scene: Scene;
    private _resizeObserver: Nullable<Observer<Engine>> = null;
    private _multiRenderTarget: MultiRenderTarget;
    private _textureTypesAndFormats: { [key: number]: { textureType: number; textureFormat: number } };
    private _ratioOrDimensions: number | { width: number; height: number };
    private _enablePosition: boolean = false;
    private _enableVelocity: boolean = false;
    private _enableReflectivity: boolean = false;
    private _depthFormat: number;
    private _clearColor = new Color4(0, 0, 0, 0);
    private _clearDepthColor = new Color4(1e8, 0, 0, 1); // "infinity" value - depth in the depth texture is view.z, not a 0..1 value!

    private _positionIndex: number = -1;
    private _velocityIndex: number = -1;
    private _reflectivityIndex: number = -1;
    private _depthIndex: number = -1;
    private _normalIndex: number = -1;

    private _linkedWithPrePass: boolean = false;
    private _prePassRenderer: PrePassRenderer;
    private _attachmentsFromPrePass: number[];
    private _useUbo: boolean;

    protected _cachedDefines: string;

    /**
     * @internal
     * Sets up internal structures to share outputs with PrePassRenderer
     * This method should only be called by the PrePassRenderer itself
     */
    public _linkPrePassRenderer(prePassRenderer: PrePassRenderer) {
        this._linkedWithPrePass = true;
        this._prePassRenderer = prePassRenderer;

        if (this._multiRenderTarget) {
            // prevents clearing of the RT since it's done by prepass
            this._multiRenderTarget.onClearObservable.clear();
            this._multiRenderTarget.onClearObservable.add(() => {
                // pass
            });
        }
    }

    /**
     * @internal
     * Separates internal structures from PrePassRenderer so the geometry buffer can now operate by itself.
     * This method should only be called by the PrePassRenderer itself
     */
    public _unlinkPrePassRenderer() {
        this._linkedWithPrePass = false;
        this._createRenderTargets();
    }

    /**
     * @internal
     * Resets the geometry buffer layout
     */
    public _resetLayout() {
        this._enablePosition = false;
        this._enableReflectivity = false;
        this._enableVelocity = false;
        this._attachmentsFromPrePass = [];
    }

    /**
     * @internal
     * Replaces a texture in the geometry buffer renderer
     * Useful when linking textures of the prepass renderer
     */
    public _forceTextureType(geometryBufferType: number, index: number) {
        if (geometryBufferType === GeometryBufferRenderer.POSITION_TEXTURE_TYPE) {
            this._positionIndex = index;
            this._enablePosition = true;
        } else if (geometryBufferType === GeometryBufferRenderer.VELOCITY_TEXTURE_TYPE) {
            this._velocityIndex = index;
            this._enableVelocity = true;
        } else if (geometryBufferType === GeometryBufferRenderer.REFLECTIVITY_TEXTURE_TYPE) {
            this._reflectivityIndex = index;
            this._enableReflectivity = true;
        } else if (geometryBufferType === GeometryBufferRenderer.DEPTH_TEXTURE_TYPE) {
            this._depthIndex = index;
        } else if (geometryBufferType === GeometryBufferRenderer.NORMAL_TEXTURE_TYPE) {
            this._normalIndex = index;
        }
    }

    /**
     * @internal
     * Sets texture attachments
     * Useful when linking textures of the prepass renderer
     */
    public _setAttachments(attachments: number[]) {
        this._attachmentsFromPrePass = attachments;
    }

    /**
     * @internal
     * Replaces the first texture which is hard coded as a depth texture in the geometry buffer
     * Useful when linking textures of the prepass renderer
     */
    public _linkInternalTexture(internalTexture: InternalTexture) {
        this._multiRenderTarget.setInternalTexture(internalTexture, 0, false);
    }

    /**
     * Gets the render list (meshes to be rendered) used in the G buffer.
     */
    public get renderList() {
        return this._multiRenderTarget.renderList;
    }

    /**
     * Set the render list (meshes to be rendered) used in the G buffer.
     */
    public set renderList(meshes: Nullable<AbstractMesh[]>) {
        this._multiRenderTarget.renderList = meshes;
    }

    /**
     * Gets whether or not G buffer are supported by the running hardware.
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
            case GeometryBufferRenderer.POSITION_TEXTURE_TYPE:
                return this._positionIndex;
            case GeometryBufferRenderer.VELOCITY_TEXTURE_TYPE:
                return this._velocityIndex;
            case GeometryBufferRenderer.REFLECTIVITY_TEXTURE_TYPE:
                return this._reflectivityIndex;
            case GeometryBufferRenderer.DEPTH_TEXTURE_TYPE:
                return this._linkedWithPrePass ? this._depthIndex : 0;
            case GeometryBufferRenderer.NORMAL_TEXTURE_TYPE:
                return this._linkedWithPrePass ? this._normalIndex : 1;
            default:
                return -1;
        }
    }

    /**
     * @returns a boolean indicating if objects positions are enabled for the G buffer.
     */
    public get enablePosition(): boolean {
        return this._enablePosition;
    }

    /**
     * Sets whether or not objects positions are enabled for the G buffer.
     */
    public set enablePosition(enable: boolean) {
        this._enablePosition = enable;

        // PrePass handles index and texture links
        if (!this._linkedWithPrePass) {
            this.dispose();
            this._createRenderTargets();
        }
    }

    /**
     * @returns a boolean indicating if objects velocities are enabled for the G buffer.
     */
    public get enableVelocity(): boolean {
        return this._enableVelocity;
    }

    /**
     * Sets whether or not objects velocities are enabled for the G buffer.
     */
    public set enableVelocity(enable: boolean) {
        this._enableVelocity = enable;

        if (!enable) {
            this._previousTransformationMatrices = {};
        }

        if (!this._linkedWithPrePass) {
            this.dispose();
            this._createRenderTargets();
        }

        this._scene.needsPreviousWorldMatrices = enable;
    }

    /**
     * Gets a boolean indicating if objects reflectivity are enabled in the G buffer.
     */
    public get enableReflectivity(): boolean {
        return this._enableReflectivity;
    }

    /**
     * Sets whether or not objects reflectivity are enabled for the G buffer.
     * For Metallic-Roughness workflow with ORM texture, we assume that ORM texture is defined according to the default layout:
     * pbr.useRoughnessFromMetallicTextureAlpha = false;
     * pbr.useRoughnessFromMetallicTextureGreen = true;
     * pbr.useMetallnessFromMetallicTextureBlue = true;
     */
    public set enableReflectivity(enable: boolean) {
        this._enableReflectivity = enable;

        if (!this._linkedWithPrePass) {
            this.dispose();
            this._createRenderTargets();
        }
    }

    /**
     * If set to true (default: false), the depth texture will be cleared with the depth value corresponding to the far plane (1 in normal mode, 0 in reverse depth buffer mode)
     * If set to false, the depth texture is always cleared with 0.
     */
    public useSpecificClearForDepthTexture = false;

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
        return typeof this._ratioOrDimensions === "object" ? 1 : this._ratioOrDimensions;
    }

    /**
     * @internal
     */
    public static _SceneComponentInitialization: (scene: Scene) => void = (_) => {
        throw _WarnImport("GeometryBufferRendererSceneComponent");
    };

    /**
     * Creates a new G Buffer for the scene
     * @param scene The scene the buffer belongs to
     * @param ratioOrDimensions How big is the buffer related to the main canvas (default: 1). You can also directly pass a width and height for the generated textures
     * @param depthFormat Format of the depth texture (default: Constants.TEXTUREFORMAT_DEPTH16)
     * @param textureTypesAndFormats The types and formats of textures to create as render targets. If not provided, all textures will be RGBA and float or half float, depending on the engine capabilities.
     */
    constructor(
        scene: Scene,
        ratioOrDimensions: number | { width: number; height: number } = 1,
        depthFormat = Constants.TEXTUREFORMAT_DEPTH16,
        textureTypesAndFormats?: { [key: number]: { textureType: number; textureFormat: number } }
    ) {
        this._scene = scene;
        this._ratioOrDimensions = ratioOrDimensions;
        this._useUbo = scene.getEngine().supportsUniformBuffers;
        this._depthFormat = depthFormat;
        this._textureTypesAndFormats = textureTypesAndFormats || {};

        GeometryBufferRenderer._SceneComponentInitialization(this._scene);

        // Render target
        this._createRenderTargets();
    }

    /**
     * Checks whether everything is ready to render a submesh to the G buffer.
     * @param subMesh the submesh to check readiness for
     * @param useInstances is the mesh drawn using instance or not
     * @returns true if ready otherwise false
     */
    public isReady(subMesh: SubMesh, useInstances: boolean): boolean {
        const material = <any>subMesh.getMaterial();

        if (material && material.disableDepthWrite) {
            return false;
        }

        const defines = [];
        const attribs = [VertexBuffer.PositionKind, VertexBuffer.NormalKind];
        const mesh = subMesh.getMesh();

        if (material) {
            let needUv = false;
            // Alpha test
            if (material.needAlphaTesting() && material.getAlphaTestTexture()) {
                defines.push("#define ALPHATEST");
                defines.push(`#define ALPHATEST_UV${material.getAlphaTestTexture().coordinatesIndex + 1}`);
                needUv = true;
            }

            // Normal map texture
            if (material.bumpTexture && MaterialFlags.BumpTextureEnabled) {
                defines.push("#define BUMP");
                defines.push(`#define BUMP_UV${material.bumpTexture.coordinatesIndex + 1}`);
                needUv = true;
            }

            if (this._enableReflectivity) {
                let metallicWorkflow = false;
                // for PBR materials: cf. https://doc.babylonjs.com/features/featuresDeepDive/materials/using/masterPBR
                if (material.getClassName() === "PBRMetallicRoughnessMaterial") {
                    // if it is a PBR material in MetallicRoughness Mode:
                    if (material.metallicRoughnessTexture !== null) {
                        defines.push("#define ORMTEXTURE");
                        defines.push(`#define REFLECTIVITY_UV${material.metallicRoughnessTexture.coordinatesIndex + 1}`);
                        defines.push("#define METALLICWORKFLOW");
                        needUv = true;
                        metallicWorkflow = true;
                    }
                    if (material.metallic !== null) {
                        defines.push("#define METALLIC");
                        defines.push("#define METALLICWORKFLOW");
                        metallicWorkflow = true;
                    }
                    if (material.roughness !== null) {
                        defines.push("#define ROUGHNESS");
                        defines.push("#define METALLICWORKFLOW");
                        metallicWorkflow = true;
                    }
                    if (metallicWorkflow) {
                        if (material.baseTexture !== null) {
                            defines.push("#define ALBEDOTEXTURE");
                            defines.push(`#define ALBEDO_UV${material.baseTexture.coordinatesIndex + 1}`);
                            if (material.baseTexture.gammaSpace) {
                                defines.push("#define GAMMAALBEDO");
                            }
                            needUv = true;
                        }
                        if (material.baseColor !== null) {
                            defines.push("#define ALBEDOCOLOR");
                        }
                    }
                } else if (material.getClassName() === "PBRSpecularGlossinessMaterial") {
                    // if it is a PBR material in Specular/Glossiness Mode:
                    if (material.specularGlossinessTexture !== null) {
                        defines.push("#define SPECULARGLOSSINESSTEXTURE");
                        defines.push(`#define REFLECTIVITY_UV${material.specularGlossinessTexture.coordinatesIndex + 1}`);
                        needUv = true;
                        if (material.specularGlossinessTexture.gammaSpace) {
                            defines.push("#define GAMMAREFLECTIVITYTEXTURE");
                        }
                    } else {
                        if (material.specularColor !== null) {
                            defines.push("#define REFLECTIVITYCOLOR");
                        }
                    }
                    if (material.glossiness !== null) {
                        defines.push("#define GLOSSINESS");
                    }
                } else if (material.getClassName() === "PBRMaterial") {
                    // if it is the bigger PBRMaterial
                    if (material.metallicTexture !== null) {
                        defines.push("#define ORMTEXTURE");
                        defines.push(`#define REFLECTIVITY_UV${material.metallicTexture.coordinatesIndex + 1}`);
                        defines.push("#define METALLICWORKFLOW");
                        needUv = true;
                        metallicWorkflow = true;
                    }
                    if (material.metallic !== null) {
                        defines.push("#define METALLIC");
                        defines.push("#define METALLICWORKFLOW");
                        metallicWorkflow = true;
                    }

                    if (material.roughness !== null) {
                        defines.push("#define ROUGHNESS");
                        defines.push("#define METALLICWORKFLOW");
                        metallicWorkflow = true;
                    }

                    if (metallicWorkflow) {
                        if (material.albedoTexture !== null) {
                            defines.push("#define ALBEDOTEXTURE");
                            defines.push(`#define ALBEDO_UV${material.albedoTexture.coordinatesIndex + 1}`);
                            if (material.albedoTexture.gammaSpace) {
                                defines.push("#define GAMMAALBEDO");
                            }
                            needUv = true;
                        }
                        if (material.albedoColor !== null) {
                            defines.push("#define ALBEDOCOLOR");
                        }
                    } else {
                        // SpecularGlossiness Model
                        if (material.reflectivityTexture !== null) {
                            defines.push("#define SPECULARGLOSSINESSTEXTURE");
                            defines.push(`#define REFLECTIVITY_UV${material.reflectivityTexture.coordinatesIndex + 1}`);
                            if (material.reflectivityTexture.gammaSpace) {
                                defines.push("#define GAMMAREFLECTIVITYTEXTURE");
                            }
                            needUv = true;
                        } else if (material.reflectivityColor !== null) {
                            defines.push("#define REFLECTIVITYCOLOR");
                        }
                        if (material.microSurface !== null) {
                            defines.push("#define GLOSSINESS");
                        }
                    }
                } else if (material.getClassName() === "StandardMaterial") {
                    // if StandardMaterial:
                    if (material.specularTexture !== null) {
                        defines.push("#define REFLECTIVITYTEXTURE");
                        defines.push(`#define REFLECTIVITY_UV${material.specularTexture.coordinatesIndex + 1}`);
                        if (material.specularTexture.gammaSpace) {
                            defines.push("#define GAMMAREFLECTIVITYTEXTURE");
                        }
                        needUv = true;
                    }
                    if (material.specularColor !== null) {
                        defines.push("#define REFLECTIVITYCOLOR");
                    }
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

        // PrePass
        if (this._linkedWithPrePass) {
            defines.push("#define PREPASS");
            if (this._depthIndex !== -1) {
                defines.push("#define DEPTH_INDEX " + this._depthIndex);
                defines.push("#define PREPASS_DEPTH");
            }
            if (this._normalIndex !== -1) {
                defines.push("#define NORMAL_INDEX " + this._normalIndex);
                defines.push("#define PREPASS_NORMAL");
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

        if (this.generateNormalsInWorldSpace) {
            defines.push("#define NORMAL_WORLDSPACE");
        }

        if (this._normalsAreUnsigned) {
            defines.push("#define ENCODE_NORMAL");
        }

        // Bones
        if (mesh.useBones && mesh.computeBonesUsingShaders && mesh.skeleton) {
            attribs.push(VertexBuffer.MatricesIndicesKind);
            attribs.push(VertexBuffer.MatricesWeightsKind);
            if (mesh.numBoneInfluencers > 4) {
                attribs.push(VertexBuffer.MatricesIndicesExtraKind);
                attribs.push(VertexBuffer.MatricesWeightsExtraKind);
            }
            defines.push("#define NUM_BONE_INFLUENCERS " + mesh.numBoneInfluencers);
            defines.push("#define BONETEXTURE " + mesh.skeleton.isUsingTextureForMatrices);
            defines.push("#define BonesPerMesh " + (mesh.skeleton.bones.length + 1));
        } else {
            defines.push("#define NUM_BONE_INFLUENCERS 0");
            defines.push("#define BONETEXTURE false");
            defines.push("#define BonesPerMesh 0");
        }

        // Morph targets
        const morphTargetManager = (mesh as Mesh).morphTargetManager;
        let numMorphInfluencers = 0;
        if (morphTargetManager) {
            numMorphInfluencers = morphTargetManager.numMaxInfluencers || morphTargetManager.numInfluencers;
            if (numMorphInfluencers > 0) {
                defines.push("#define MORPHTARGETS");
                defines.push("#define NUM_MORPH_INFLUENCERS " + numMorphInfluencers);
                if (morphTargetManager.isUsingTextureForTargets) {
                    defines.push("#define MORPHTARGETS_TEXTURE");
                }
                MaterialHelper.PrepareAttributesForMorphTargetsInfluencers(attribs, mesh, numMorphInfluencers);
            }
        }

        // Instances
        if (useInstances) {
            defines.push("#define INSTANCES");
            MaterialHelper.PushAttributesForInstances(attribs, this._enableVelocity);
            if (subMesh.getRenderingMesh().hasThinInstances) {
                defines.push("#define THIN_INSTANCES");
            }
        }

        // Setup textures count
        if (this._linkedWithPrePass) {
            defines.push("#define RENDER_TARGET_COUNT " + this._attachmentsFromPrePass.length);
        } else {
            defines.push("#define RENDER_TARGET_COUNT " + this._multiRenderTarget.textures.length);
        }

        prepareStringDefinesForClipPlanes(material, this._scene, defines);

        // Get correct effect
        const engine = this._scene.getEngine();
        const drawWrapper = subMesh._getDrawWrapper(undefined, true)!;
        const cachedDefines = drawWrapper.defines;
        const join = defines.join("\n");
        if (cachedDefines !== join) {
            drawWrapper.setEffect(
                engine.createEffect(
                    "geometry",
                    {
                        attributes: attribs,
                        uniformsNames: uniforms,
                        samplers: ["diffuseSampler", "bumpSampler", "reflectivitySampler", "albedoSampler", "morphTargets", "boneSampler"],
                        defines: join,
                        onCompiled: null,
                        fallbacks: null,
                        onError: null,
                        uniformBuffersNames: ["Scene"],
                        indexParameters: { buffersCount: this._multiRenderTarget.textures.length - 1, maxSimultaneousMorphTargets: numMorphInfluencers },
                    },
                    engine
                ),
                join
            );
        }

        return drawWrapper.effect!.isReady();
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
        if (this._resizeObserver) {
            const engine = this._scene.getEngine();
            engine.onResizeObservable.remove(this._resizeObserver);
            this._resizeObserver = null;
        }
        this.getGBuffer().dispose();
    }

    private _assignRenderTargetIndices(): [number, string[], Array<{ textureType: number; textureFormat: number } | undefined>] {
        const textureNames: string[] = [];
        const textureTypesAndFormats: Array<{ textureType: number; textureFormat: number } | undefined> = [];
        let count = 2;

        textureNames.push("gBuffer_Depth", "gBuffer_Normal");

        textureTypesAndFormats.push(this._textureTypesAndFormats[GeometryBufferRenderer.DEPTH_TEXTURE_TYPE]);
        textureTypesAndFormats.push(this._textureTypesAndFormats[GeometryBufferRenderer.NORMAL_TEXTURE_TYPE]);

        if (this._enablePosition) {
            this._positionIndex = count;
            count++;
            textureNames.push("gBuffer_Position");
            textureTypesAndFormats.push(this._textureTypesAndFormats[GeometryBufferRenderer.POSITION_TEXTURE_TYPE]);
        }

        if (this._enableVelocity) {
            this._velocityIndex = count;
            count++;
            textureNames.push("gBuffer_Velocity");
            textureTypesAndFormats.push(this._textureTypesAndFormats[GeometryBufferRenderer.VELOCITY_TEXTURE_TYPE]);
        }

        if (this._enableReflectivity) {
            this._reflectivityIndex = count;
            count++;
            textureNames.push("gBuffer_Reflectivity");
            textureTypesAndFormats.push(this._textureTypesAndFormats[GeometryBufferRenderer.REFLECTIVITY_TEXTURE_TYPE]);
        }

        return [count, textureNames, textureTypesAndFormats];
    }

    protected _createRenderTargets(): void {
        const engine = this._scene.getEngine();
        const [count, textureNames, textureTypesAndFormat] = this._assignRenderTargetIndices();

        let type = Constants.TEXTURETYPE_UNSIGNED_BYTE;
        if (engine._caps.textureFloat && engine._caps.textureFloatLinearFiltering) {
            type = Constants.TEXTURETYPE_FLOAT;
        } else if (engine._caps.textureHalfFloat && engine._caps.textureHalfFloatLinearFiltering) {
            type = Constants.TEXTURETYPE_HALF_FLOAT;
        }

        const dimensions =
            (this._ratioOrDimensions as any).width !== undefined
                ? (this._ratioOrDimensions as { width: number; height: number })
                : { width: engine.getRenderWidth() * (this._ratioOrDimensions as number), height: engine.getRenderHeight() * (this._ratioOrDimensions as number) };

        const textureTypes: number[] = [];
        const textureFormats: number[] = [];

        for (const typeAndFormat of textureTypesAndFormat) {
            if (typeAndFormat) {
                textureTypes.push(typeAndFormat.textureType);
                textureFormats.push(typeAndFormat.textureFormat);
            } else {
                textureTypes.push(type);
                textureFormats.push(Constants.TEXTUREFORMAT_RGBA);
            }
        }

        this._normalsAreUnsigned =
            textureTypes[GeometryBufferRenderer.NORMAL_TEXTURE_TYPE] === Constants.TEXTURETYPE_UNSIGNED_INT_2_10_10_10_REV ||
            textureTypes[GeometryBufferRenderer.NORMAL_TEXTURE_TYPE] === Constants.TEXTURETYPE_UNSIGNED_INT_10F_11F_11F_REV;

        this._multiRenderTarget = new MultiRenderTarget(
            "gBuffer",
            dimensions,
            count,
            this._scene,
            { generateMipMaps: false, generateDepthTexture: true, types: textureTypes, formats: textureFormats, depthTextureFormat: this._depthFormat },
            textureNames.concat("gBuffer_DepthBuffer")
        );
        if (!this.isSupported) {
            return;
        }
        this._multiRenderTarget.wrapU = Texture.CLAMP_ADDRESSMODE;
        this._multiRenderTarget.wrapV = Texture.CLAMP_ADDRESSMODE;
        this._multiRenderTarget.refreshRate = 1;
        this._multiRenderTarget.renderParticles = false;
        this._multiRenderTarget.renderList = null;

        // Depth is always the first texture in the geometry buffer renderer!
        const layoutAttachmentsAll = [true];
        const layoutAttachmentsAllButDepth = [false];
        const layoutAttachmentsDepthOnly = [true];

        for (let i = 1; i < count; ++i) {
            layoutAttachmentsAll.push(true);
            layoutAttachmentsDepthOnly.push(false);
            layoutAttachmentsAllButDepth.push(true);
        }

        const attachmentsAll = engine.buildTextureLayout(layoutAttachmentsAll);
        const attachmentsAllButDepth = engine.buildTextureLayout(layoutAttachmentsAllButDepth);
        const attachmentsDepthOnly = engine.buildTextureLayout(layoutAttachmentsDepthOnly);

        this._multiRenderTarget.onClearObservable.add((engine) => {
            engine.bindAttachments(this.useSpecificClearForDepthTexture ? attachmentsAllButDepth : attachmentsAll);
            engine.clear(this._clearColor, true, true, true);
            if (this.useSpecificClearForDepthTexture) {
                engine.bindAttachments(attachmentsDepthOnly);
                engine.clear(this._clearDepthColor, true, true, true);
            }
            engine.bindAttachments(attachmentsAll);
        });

        this._resizeObserver = engine.onResizeObservable.add(() => {
            if (this._multiRenderTarget) {
                const dimensions =
                    (this._ratioOrDimensions as any).width !== undefined
                        ? (this._ratioOrDimensions as { width: number; height: number })
                        : { width: engine.getRenderWidth() * (this._ratioOrDimensions as number), height: engine.getRenderHeight() * (this._ratioOrDimensions as number) };
                this._multiRenderTarget.resize(dimensions);
            }
        });

        // Custom render function
        const renderSubMesh = (subMesh: SubMesh): void => {
            const renderingMesh = subMesh.getRenderingMesh();
            const effectiveMesh = subMesh.getEffectiveMesh();
            const scene = this._scene;
            const engine = scene.getEngine();
            const material = <any>subMesh.getMaterial();

            if (!material) {
                return;
            }

            effectiveMesh._internalAbstractMeshDataInfo._isActiveIntermediate = false;

            // Velocity
            if (this._enableVelocity && !this._previousTransformationMatrices[effectiveMesh.uniqueId]) {
                this._previousTransformationMatrices[effectiveMesh.uniqueId] = {
                    world: Matrix.Identity(),
                    viewProjection: scene.getTransformMatrix(),
                };

                if (renderingMesh.skeleton) {
                    const bonesTransformations = renderingMesh.skeleton.getTransformMatrices(renderingMesh);
                    this._previousBonesTransformationMatrices[renderingMesh.uniqueId] = this._copyBonesTransformationMatrices(
                        bonesTransformations,
                        new Float32Array(bonesTransformations.length)
                    );
                }
            }

            // Managing instances
            const batch = renderingMesh._getInstancesRenderList(subMesh._id, !!subMesh.getReplacementMesh());

            if (batch.mustReturn) {
                return;
            }

            const hardwareInstancedRendering = engine.getCaps().instancedArrays && (batch.visibleInstances[subMesh._id] !== null || renderingMesh.hasThinInstances);
            const world = effectiveMesh.getWorldMatrix();

            if (this.isReady(subMesh, hardwareInstancedRendering)) {
                const drawWrapper = subMesh._getDrawWrapper();

                if (!drawWrapper) {
                    return;
                }

                const effect = drawWrapper.effect!;

                engine.enableEffect(drawWrapper);
                if (!hardwareInstancedRendering) {
                    renderingMesh._bind(subMesh, effect, material.fillMode);
                }

                if (!this._useUbo) {
                    effect.setMatrix("viewProjection", scene.getTransformMatrix());
                    effect.setMatrix("view", scene.getViewMatrix());
                } else {
                    MaterialHelper.BindSceneUniformBuffer(effect, this._scene.getSceneUniformBuffer());
                    this._scene.finalizeSceneUbo();
                }

                let sideOrientation: Nullable<number>;
                const instanceDataStorage = (renderingMesh as Mesh)._instanceDataStorage;

                if (!instanceDataStorage.isFrozen && (material.backFaceCulling || renderingMesh.overrideMaterialSideOrientation !== null)) {
                    const mainDeterminant = effectiveMesh._getWorldMatrixDeterminant();
                    sideOrientation = renderingMesh.overrideMaterialSideOrientation;
                    if (sideOrientation === null) {
                        sideOrientation = material.sideOrientation;
                    }
                    if (mainDeterminant < 0) {
                        sideOrientation = sideOrientation === Material.ClockWiseSideOrientation ? Material.CounterClockWiseSideOrientation : Material.ClockWiseSideOrientation;
                    }
                } else {
                    sideOrientation = instanceDataStorage.sideOrientation;
                }

                material._preBind(drawWrapper, sideOrientation);

                // Alpha test
                if (material.needAlphaTesting()) {
                    const alphaTexture = material.getAlphaTestTexture();
                    if (alphaTexture) {
                        effect.setTexture("diffuseSampler", alphaTexture);
                        effect.setMatrix("diffuseMatrix", alphaTexture.getTextureMatrix());
                    }
                }

                // Bump
                if (material.bumpTexture && scene.getEngine().getCaps().standardDerivatives && MaterialFlags.BumpTextureEnabled) {
                    effect.setFloat3("vBumpInfos", material.bumpTexture.coordinatesIndex, 1.0 / material.bumpTexture.level, material.parallaxScaleBias);
                    effect.setMatrix("bumpMatrix", material.bumpTexture.getTextureMatrix());
                    effect.setTexture("bumpSampler", material.bumpTexture);
                    effect.setFloat2("vTangentSpaceParams", material.invertNormalMapX ? -1.0 : 1.0, material.invertNormalMapY ? -1.0 : 1.0);
                }

                // Reflectivity
                if (this._enableReflectivity) {
                    // for PBR materials: cf. https://doc.babylonjs.com/features/featuresDeepDive/materials/using/masterPBR
                    if (material.getClassName() === "PBRMetallicRoughnessMaterial") {
                        // if it is a PBR material in MetallicRoughness Mode:
                        if (material.metallicRoughnessTexture !== null) {
                            effect.setTexture("reflectivitySampler", material.metallicRoughnessTexture);
                            effect.setMatrix("reflectivityMatrix", material.metallicRoughnessTexture.getTextureMatrix());
                        }
                        if (material.metallic !== null) {
                            effect.setFloat("metallic", material.metallic);
                        }
                        if (material.roughness !== null) {
                            effect.setFloat("glossiness", 1.0 - material.roughness);
                        }
                        if (material.baseTexture !== null) {
                            effect.setTexture("albedoSampler", material.baseTexture);
                            effect.setMatrix("albedoMatrix", material.baseTexture.getTextureMatrix());
                        }
                        if (material.baseColor !== null) {
                            effect.setColor3("albedoColor", material.baseColor);
                        }
                    } else if (material.getClassName() === "PBRSpecularGlossinessMaterial") {
                        // if it is a PBR material in Specular/Glossiness Mode:
                        if (material.specularGlossinessTexture !== null) {
                            effect.setTexture("reflectivitySampler", material.specularGlossinessTexture);
                            effect.setMatrix("reflectivityMatrix", material.specularGlossinessTexture.getTextureMatrix());
                        } else {
                            if (material.specularColor !== null) {
                                effect.setColor3("reflectivityColor", material.specularColor);
                            }
                        }
                        if (material.glossiness !== null) {
                            effect.setFloat("glossiness", material.glossiness);
                        }
                    } else if (material.getClassName() === "PBRMaterial") {
                        // if it is the bigger PBRMaterial
                        if (material.metallicTexture !== null) {
                            effect.setTexture("reflectivitySampler", material.metallicTexture);
                            effect.setMatrix("reflectivityMatrix", material.metallicTexture.getTextureMatrix());
                        }
                        if (material.metallic !== null) {
                            effect.setFloat("metallic", material.metallic);
                        }

                        if (material.roughness !== null) {
                            effect.setFloat("glossiness", 1.0 - material.roughness);
                        }

                        if (material.roughness !== null || material.metallic !== null || material.metallicTexture !== null) {
                            // MetallicRoughness Model
                            if (material.albedoTexture !== null) {
                                effect.setTexture("albedoSampler", material.albedoTexture);
                                effect.setMatrix("albedoMatrix", material.albedoTexture.getTextureMatrix());
                            }
                            if (material.albedoColor !== null) {
                                effect.setColor3("albedoColor", material.albedoColor);
                            }
                        } else {
                            // SpecularGlossiness Model
                            if (material.reflectivityTexture !== null) {
                                effect.setTexture("reflectivitySampler", material.reflectivityTexture);
                                effect.setMatrix("reflectivityMatrix", material.reflectivityTexture.getTextureMatrix());
                            } else if (material.reflectivityColor !== null) {
                                effect.setColor3("reflectivityColor", material.reflectivityColor);
                            }
                            if (material.microSurface !== null) {
                                effect.setFloat("glossiness", material.microSurface);
                            }
                        }
                    } else if (material.getClassName() === "StandardMaterial") {
                        // if StandardMaterial:
                        if (material.specularTexture !== null) {
                            effect.setTexture("reflectivitySampler", material.specularTexture);
                            effect.setMatrix("reflectivityMatrix", material.specularTexture.getTextureMatrix());
                        }
                        if (material.specularColor !== null) {
                            effect.setColor3("reflectivityColor", material.specularColor);
                        }
                    }
                }

                // Clip plane
                bindClipPlane(effect, material, this._scene);

                // Bones
                if (renderingMesh.useBones && renderingMesh.computeBonesUsingShaders && renderingMesh.skeleton) {
                    const skeleton = renderingMesh.skeleton;

                    if (skeleton.isUsingTextureForMatrices && effect.getUniformIndex("boneTextureWidth") > -1) {
                        const boneTexture = skeleton.getTransformMatrixTexture(renderingMesh);
                        effect.setTexture("boneSampler", boneTexture);
                        effect.setFloat("boneTextureWidth", 4.0 * (skeleton.bones.length + 1));
                    } else {
                        effect.setMatrices("mBones", renderingMesh.skeleton.getTransformMatrices(renderingMesh));
                    }

                    if (this._enableVelocity) {
                        effect.setMatrices("mPreviousBones", this._previousBonesTransformationMatrices[renderingMesh.uniqueId]);
                    }
                }

                // Morph targets
                MaterialHelper.BindMorphTargetParameters(renderingMesh, effect);
                if (renderingMesh.morphTargetManager && renderingMesh.morphTargetManager.isUsingTextureForTargets) {
                    renderingMesh.morphTargetManager._bind(effect);
                }

                // Velocity
                if (this._enableVelocity) {
                    effect.setMatrix("previousWorld", this._previousTransformationMatrices[effectiveMesh.uniqueId].world);
                    effect.setMatrix("previousViewProjection", this._previousTransformationMatrices[effectiveMesh.uniqueId].viewProjection);
                }

                if (hardwareInstancedRendering && renderingMesh.hasThinInstances) {
                    effect.setMatrix("world", world);
                }

                // Draw
                renderingMesh._processRendering(effectiveMesh, subMesh, effect, material.fillMode, batch, hardwareInstancedRendering, (isInstance, w) => {
                    if (!isInstance) {
                        effect.setMatrix("world", w);
                    }
                });
            }

            // Velocity
            if (this._enableVelocity) {
                this._previousTransformationMatrices[effectiveMesh.uniqueId].world = world.clone();
                this._previousTransformationMatrices[effectiveMesh.uniqueId].viewProjection = this._scene.getTransformMatrix().clone();
                if (renderingMesh.skeleton) {
                    this._copyBonesTransformationMatrices(
                        renderingMesh.skeleton.getTransformMatrices(renderingMesh),
                        this._previousBonesTransformationMatrices[effectiveMesh.uniqueId]
                    );
                }
            }
        };

        this._multiRenderTarget.customIsReadyFunction = (mesh: AbstractMesh, refreshRate: number, preWarm?: boolean) => {
            if ((preWarm || refreshRate === 0) && mesh.subMeshes) {
                for (let i = 0; i < mesh.subMeshes.length; ++i) {
                    const subMesh = mesh.subMeshes[i];
                    const material = subMesh.getMaterial();
                    const renderingMesh = subMesh.getRenderingMesh();

                    if (!material) {
                        continue;
                    }

                    const batch = renderingMesh._getInstancesRenderList(subMesh._id, !!subMesh.getReplacementMesh());
                    const hardwareInstancedRendering = engine.getCaps().instancedArrays && (batch.visibleInstances[subMesh._id] !== null || renderingMesh.hasThinInstances);

                    if (!this.isReady(subMesh, hardwareInstancedRendering)) {
                        return false;
                    }
                }
            }

            return true;
        };

        this._multiRenderTarget.customRenderFunction = (
            opaqueSubMeshes: SmartArray<SubMesh>,
            alphaTestSubMeshes: SmartArray<SubMesh>,
            transparentSubMeshes: SmartArray<SubMesh>,
            depthOnlySubMeshes: SmartArray<SubMesh>
        ): void => {
            let index;

            if (this._linkedWithPrePass) {
                if (!this._prePassRenderer.enabled) {
                    return;
                }
                this._scene.getEngine().bindAttachments(this._attachmentsFromPrePass);
            }

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

            engine.setDepthWrite(false);
            for (index = 0; index < alphaTestSubMeshes.length; index++) {
                renderSubMesh(alphaTestSubMeshes.data[index]);
            }

            if (this.renderTransparentMeshes) {
                for (index = 0; index < transparentSubMeshes.length; index++) {
                    renderSubMesh(transparentSubMeshes.data[index]);
                }
            }
            engine.setDepthWrite(true);
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
