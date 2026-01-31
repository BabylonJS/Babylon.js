import type { SmartArray } from "../Misc/smartArray";
import { Observable } from "../Misc/observable";
import type { Nullable } from "../types";
import type { Camera } from "../Cameras/camera";
import type { Scene } from "../scene";
import { Color4 } from "../Maths/math.color";
import type { AbstractEngine } from "../Engines/abstractEngine";
import { EngineStore } from "../Engines/engineStore";
import { VertexBuffer } from "../Buffers/buffer";
import type { SubMesh } from "../Meshes/subMesh";
import type { AbstractMesh } from "../Meshes/abstractMesh";
import type { Mesh } from "../Meshes/mesh";
import type { EffectWrapperCreationOptions } from "core/Materials/effectRenderer";
import { EffectWrapper } from "core/Materials/effectRenderer";
import type { BaseTexture } from "../Materials/Textures/baseTexture";
import type { Effect } from "../Materials/effect";
import { Material } from "../Materials/material";
import { Constants } from "../Engines/constants";

import type { DataBuffer } from "../Buffers/dataBuffer";
import { EffectFallbacks } from "../Materials/effectFallbacks";
import { DrawWrapper } from "../Materials/drawWrapper";
import { AddClipPlaneUniforms, BindClipPlane, PrepareStringDefinesForClipPlanes } from "../Materials/clipPlaneMaterialHelper";
import { BindBonesParameters, BindMorphTargetParameters, PrepareDefinesAndAttributesForMorphTargets, PushAttributesForInstances } from "../Materials/materialHelper.functions";
import { ShaderLanguage } from "core/Materials/shaderLanguage";
import { ObjectRenderer } from "core/Rendering/objectRenderer";
import type { Vector2 } from "../Maths/math.vector";
import { Engine } from "core/Engines/engine";

/**
 * Special Glow Blur post process only blurring the alpha channel
 * It enforces keeping the most luminous color in the color channel.
 * @internal
 */
export class ThinGlowBlurPostProcess extends EffectWrapper {
    /**
     * The fragment shader url
     */
    public static readonly FragmentUrl = "glowBlurPostProcess";

    /**
     * The list of uniforms used by the effect
     */
    public static readonly Uniforms = ["screenSize", "direction", "blurWidth"];

    constructor(
        name: string,
        engine: Nullable<AbstractEngine> = null,
        public direction: Vector2,
        public kernel: number,
        options?: EffectWrapperCreationOptions
    ) {
        super({
            ...options,
            name,
            engine: engine || Engine.LastCreatedEngine!,
            useShaderStore: true,
            useAsPostProcess: true,
            fragmentShader: ThinGlowBlurPostProcess.FragmentUrl,
            uniforms: ThinGlowBlurPostProcess.Uniforms,
        });
    }

    protected override _gatherImports(useWebGPU: boolean, list: Promise<any>[]) {
        if (useWebGPU) {
            this._webGPUReady = true;
            list.push(import("../ShadersWGSL/glowBlurPostProcess.fragment"));
        } else {
            list.push(import("../Shaders/glowBlurPostProcess.fragment"));
        }

        super._gatherImports(useWebGPU, list);
    }

    public textureWidth: number = 0;

    public textureHeight: number = 0;

    public override bind() {
        super.bind();
        this._drawWrapper.effect!.setFloat2("screenSize", this.textureWidth, this.textureHeight);
        this._drawWrapper.effect!.setVector2("direction", this.direction);
        this._drawWrapper.effect!.setFloat("blurWidth", this.kernel);
    }
}

/**
 * Effect layer options. This helps customizing the behaviour
 * of the effect layer.
 */
export interface IThinEffectLayerOptions {
    /**
     * Multiplication factor apply to the canvas size to compute the render target size
     * used to generated the glowing objects (the smaller the faster). Default: 0.5
     */
    mainTextureRatio?: number;

    /**
     * Enforces a fixed size texture to ensure resize independent blur. Default: undefined
     */
    mainTextureFixedSize?: number;

    /**
     * The type of the main texture. Default: TEXTURETYPE_UNSIGNED_BYTE
     */
    mainTextureType?: number;

    /**
     * The format of the main texture. Default: TEXTUREFORMAT_RGBA
     */
    mainTextureFormat?: number;

    /**
     * Alpha blending mode used to apply the blur. Default depends of the implementation. Default: ALPHA_COMBINE
     */
    alphaBlendingMode?: number;

    /**
     * The camera attached to the layer. Default: null
     */
    camera?: Nullable<Camera>;

    /**
     * The rendering group to draw the layer in. Default: -1
     */
    renderingGroupId?: number;
}

/**
 * @internal
 */
export class ThinEffectLayer {
    private _vertexBuffers: { [key: string]: Nullable<VertexBuffer> } = {};
    private _indexBuffer: Nullable<DataBuffer>;
    private _mergeDrawWrapper: DrawWrapper[];
    protected _dontCheckIfReady = false;

    protected _scene: Scene;
    protected _engine: AbstractEngine;
    /** @internal */
    public _options: Required<IThinEffectLayerOptions>;
    protected _objectRenderer: ObjectRenderer;
    /** @internal */
    public _shouldRender = true;
    /** @internal */
    public _emissiveTextureAndColor: { texture: Nullable<BaseTexture>; color: Color4 } = { texture: null, color: new Color4() };
    /** @internal */
    public _effectIntensity: { [meshUniqueId: number]: number } = {};
    /** @internal */
    public _postProcesses: EffectWrapper[] = [];

    /**
     * Force all the effect layers to compile to glsl even on WebGPU engines.
     * False by default. This is mostly meant for backward compatibility.
     */
    public static ForceGLSL = false;

    /**
     * The name of the layer
     */
    public name: string;

    /**
     * The clear color of the texture used to generate the glow map.
     */
    public neutralColor: Color4 = new Color4();

    /**
     * Specifies whether the effect layer is enabled or not.
     */
    public isEnabled: boolean = true;

    /**
     * Gets/sets the camera attached to the layer.
     */
    public get camera(): Nullable<Camera> {
        return this._options.camera;
    }

    public set camera(camera: Nullable<Camera>) {
        this._options.camera = camera;
    }

    /**
     * Gets the rendering group id the layer should render in.
     */
    public get renderingGroupId(): number {
        return this._options.renderingGroupId;
    }
    public set renderingGroupId(renderingGroupId: number) {
        this._options.renderingGroupId = renderingGroupId;
    }

    /**
     * Specifies if the bounding boxes should be rendered normally or if they should undergo the effect of the layer
     */
    public disableBoundingBoxesFromEffectLayer = false;

    /**
     * An event triggered when the effect layer has been disposed.
     */
    public onDisposeObservable = new Observable<ThinEffectLayer>();

    /**
     * An event triggered when the effect layer is about rendering the main texture with the glowy parts.
     */
    public onBeforeRenderLayerObservable = new Observable<ThinEffectLayer>();

    /**
     * An event triggered when the generated texture is being merged in the scene.
     */
    public onBeforeComposeObservable = new Observable<ThinEffectLayer>();

    /**
     * An event triggered when the mesh is rendered into the effect render target.
     */
    public onBeforeRenderMeshToEffect = new Observable<AbstractMesh>();

    /**
     * An event triggered after the mesh has been rendered into the effect render target.
     */
    public onAfterRenderMeshToEffect = new Observable<AbstractMesh>();

    /**
     * An event triggered when the generated texture has been merged in the scene.
     */
    public onAfterComposeObservable = new Observable<ThinEffectLayer>();

    /**
     * An event triggered when the layer is being blurred.
     */
    public onBeforeBlurObservable = new Observable<ThinEffectLayer>();

    /**
     * An event triggered when the layer has been blurred.
     */
    public onAfterBlurObservable = new Observable<ThinEffectLayer>();

    /**
     * Gets the object renderer used to render objects in the layer
     */
    public get objectRenderer() {
        return this._objectRenderer;
    }

    protected _shaderLanguage = ShaderLanguage.GLSL;

    /**
     * Gets the shader language used in this material.
     */
    public get shaderLanguage(): ShaderLanguage {
        return this._shaderLanguage;
    }

    private _materialForRendering: { [id: string]: [AbstractMesh, Material] } = {};

    /**
     * Sets a specific material to be used to render a mesh/a list of meshes in the layer
     * @param mesh mesh or array of meshes
     * @param material material to use by the layer when rendering the mesh(es). If undefined is passed, the specific material created by the layer will be used.
     */
    public setMaterialForRendering(mesh: AbstractMesh | AbstractMesh[], material?: Material): void {
        this._objectRenderer.setMaterialForRendering(mesh, material);
        if (Array.isArray(mesh)) {
            for (let i = 0; i < mesh.length; ++i) {
                const currentMesh = mesh[i];
                if (!material) {
                    delete this._materialForRendering[currentMesh.uniqueId];
                } else {
                    this._materialForRendering[currentMesh.uniqueId] = [currentMesh, material];
                }
            }
        } else {
            if (!material) {
                delete this._materialForRendering[mesh.uniqueId];
            } else {
                this._materialForRendering[mesh.uniqueId] = [mesh, material];
            }
        }
    }

    /**
     * Gets the intensity of the effect for a specific mesh.
     * @param mesh The mesh to get the effect intensity for
     * @returns The intensity of the effect for the mesh
     */
    public getEffectIntensity(mesh: AbstractMesh) {
        return this._effectIntensity[mesh.uniqueId] ?? 1;
    }

    /**
     * Sets the intensity of the effect for a specific mesh.
     * @param mesh The mesh to set the effect intensity for
     * @param intensity The intensity of the effect for the mesh
     */
    public setEffectIntensity(mesh: AbstractMesh, intensity: number): void {
        this._effectIntensity[mesh.uniqueId] = intensity;
    }

    /**
     * Instantiates a new effect Layer
     * @param name The name of the layer
     * @param scene The scene to use the layer in
     * @param forceGLSL Use the GLSL code generation for the shader (even on WebGPU). Default is false
     * @param dontCheckIfReady Specifies if the layer should disable checking whether all the post processes are ready (default: false). To save performance, this should be set to true and you should call `isReady` manually before rendering to the layer.
     * @param _additionalImportShadersAsync Additional shaders to import when the layer is created
     */
    constructor(
        name: string,
        scene?: Scene,
        forceGLSL = false,
        dontCheckIfReady = false,
        private _additionalImportShadersAsync?: () => Promise<void>
    ) {
        this.name = name;
        this._scene = scene || <Scene>EngineStore.LastCreatedScene;
        this._dontCheckIfReady = dontCheckIfReady;

        const engine = this._scene.getEngine();

        if (engine.isWebGPU && !forceGLSL && !ThinEffectLayer.ForceGLSL) {
            this._shaderLanguage = ShaderLanguage.WGSL;
        }

        this._engine = this._scene.getEngine();

        this._mergeDrawWrapper = [];

        // Generate Buffers
        this._generateIndexBuffer();
        this._generateVertexBuffer();
    }

    /** @internal */
    public _shadersLoaded = false;

    /**
     * Get the effect name of the layer.
     * @returns The effect name
     */
    public getEffectName(): string {
        return "";
    }

    /**
     * Checks for the readiness of the element composing the layer.
     * @param _subMesh the mesh to check for
     * @param _useInstances specify whether or not to use instances to render the mesh
     * @returns true if ready otherwise, false
     */
    public isReady(_subMesh: SubMesh, _useInstances: boolean): boolean {
        return true;
    }

    /**
     * Returns whether or not the layer needs stencil enabled during the mesh rendering.
     * @returns true if the effect requires stencil during the main canvas render pass.
     */
    public needStencil(): boolean {
        return false;
    }

    /** @internal */
    public _createMergeEffect(): Effect {
        throw new Error("Effect Layer: no merge effect defined");
    }

    /** @internal */
    public _createTextureAndPostProcesses(): void {}

    /** @internal */
    public bindTexturesForCompose: (effect: Effect) => void;

    /** @internal */
    public _internalCompose(_effect: Effect, _renderIndex: number): void {}

    /** @internal */
    public _setEmissiveTextureAndColor(_mesh: Mesh, _subMesh: SubMesh, _material: Material): void {}

    /** @internal */
    public _numInternalDraws(): number {
        return 1;
    }

    /** @internal */
    public _init(options: IThinEffectLayerOptions): void {
        // Adapt options
        this._options = {
            mainTextureRatio: 0.5,
            mainTextureFixedSize: 0,
            mainTextureType: Constants.TEXTURETYPE_UNSIGNED_BYTE,
            mainTextureFormat: Constants.TEXTUREFORMAT_RGBA,
            alphaBlendingMode: Constants.ALPHA_COMBINE,
            camera: null,
            renderingGroupId: -1,
            ...options,
        };

        this._createObjectRenderer();
    }

    private _generateIndexBuffer(): void {
        // Indices
        const indices = [];
        indices.push(0);
        indices.push(1);
        indices.push(2);

        indices.push(0);
        indices.push(2);
        indices.push(3);

        this._indexBuffer = this._engine.createIndexBuffer(indices);
    }

    private _generateVertexBuffer(): void {
        // VBO
        const vertices = [];
        vertices.push(1, 1);
        vertices.push(-1, 1);
        vertices.push(-1, -1);
        vertices.push(1, -1);

        const vertexBuffer = new VertexBuffer(this._engine, vertices, VertexBuffer.PositionKind, false, false, 2);
        this._vertexBuffers[VertexBuffer.PositionKind] = vertexBuffer;
    }

    protected _createObjectRenderer(): void {
        this._objectRenderer = new ObjectRenderer(`ObjectRenderer for thin effect layer ${this.name}`, this._scene, {
            doNotChangeAspectRatio: true,
        });
        this._objectRenderer.activeCamera = this._options.camera;
        this._objectRenderer.renderParticles = false;
        this._objectRenderer.renderList = null;

        // Prevent package size in es6 (getBoundingBoxRenderer might not be present)
        const hasBoundingBoxRenderer = !!this._scene.getBoundingBoxRenderer;

        let boundingBoxRendererEnabled = false;
        if (hasBoundingBoxRenderer) {
            this._objectRenderer.onBeforeRenderObservable.add(() => {
                boundingBoxRendererEnabled = this._scene.getBoundingBoxRenderer().enabled;
                this._scene.getBoundingBoxRenderer().enabled = !this.disableBoundingBoxesFromEffectLayer && boundingBoxRendererEnabled;
            });

            this._objectRenderer.onAfterRenderObservable.add(() => {
                this._scene.getBoundingBoxRenderer().enabled = boundingBoxRendererEnabled;
            });
        }

        this._objectRenderer.customIsReadyFunction = (mesh: AbstractMesh, refreshRate: number, preWarm?: boolean) => {
            if ((preWarm || refreshRate === 0) && mesh.subMeshes) {
                for (let i = 0; i < mesh.subMeshes.length; ++i) {
                    const subMesh = mesh.subMeshes[i];
                    const material = subMesh.getMaterial();
                    const renderingMesh = subMesh.getRenderingMesh();

                    if (!material) {
                        continue;
                    }

                    const batch = renderingMesh._getInstancesRenderList(subMesh._id, !!subMesh.getReplacementMesh());
                    const hardwareInstancedRendering = batch.hardwareInstancedRendering[subMesh._id] || renderingMesh.hasThinInstances;

                    this._setEmissiveTextureAndColor(renderingMesh, subMesh, material);

                    if (!this._isSubMeshReady(subMesh, hardwareInstancedRendering, this._emissiveTextureAndColor.texture)) {
                        return false;
                    }
                }
            }

            return true;
        };

        // Custom render function
        this._objectRenderer.customRenderFunction = (
            opaqueSubMeshes: SmartArray<SubMesh>,
            alphaTestSubMeshes: SmartArray<SubMesh>,
            transparentSubMeshes: SmartArray<SubMesh>,
            depthOnlySubMeshes: SmartArray<SubMesh>
        ): void => {
            this.onBeforeRenderLayerObservable.notifyObservers(this);

            let index: number;

            const engine = this._scene.getEngine();

            if (depthOnlySubMeshes.length) {
                engine.setColorWrite(false);
                for (index = 0; index < depthOnlySubMeshes.length; index++) {
                    this._renderSubMesh(depthOnlySubMeshes.data[index]);
                }
                engine.setColorWrite(true);
            }

            for (index = 0; index < opaqueSubMeshes.length; index++) {
                this._renderSubMesh(opaqueSubMeshes.data[index]);
            }

            for (index = 0; index < alphaTestSubMeshes.length; index++) {
                this._renderSubMesh(alphaTestSubMeshes.data[index]);
            }

            const previousAlphaMode = engine.getAlphaMode();

            for (index = 0; index < transparentSubMeshes.length; index++) {
                const subMesh = transparentSubMeshes.data[index];
                const material = subMesh.getMaterial();
                if (material && material.needDepthPrePass) {
                    const engine = material.getScene().getEngine();
                    engine.setColorWrite(false);
                    this._renderSubMesh(subMesh);
                    engine.setColorWrite(true);
                }
                this._renderSubMesh(subMesh, true);
            }

            engine.setAlphaMode(previousAlphaMode);
        };
    }

    /** @internal */
    public _addCustomEffectDefines(_defines: string[]): void {}

    /** @internal */
    public _internalIsSubMeshReady(subMesh: SubMesh, useInstances: boolean, emissiveTexture: Nullable<BaseTexture>): boolean {
        const engine = this._scene.getEngine();
        const mesh = subMesh.getMesh();

        const renderingMaterial = mesh._internalAbstractMeshDataInfo._materialForRenderPass?.[engine.currentRenderPassId];

        if (renderingMaterial) {
            return renderingMaterial.isReadyForSubMesh(mesh, subMesh, useInstances);
        }

        const material = subMesh.getMaterial();

        if (!material) {
            return false;
        }

        if (this._useMeshMaterial(subMesh.getRenderingMesh())) {
            return material.isReadyForSubMesh(subMesh.getMesh(), subMesh, useInstances);
        }

        const defines: string[] = [];

        const attribs = [VertexBuffer.PositionKind];

        let uv1 = false;
        let uv2 = false;
        const color = false;

        // Diffuse
        if (material) {
            const needAlphaTest = material.needAlphaTestingForMesh(mesh);

            const diffuseTexture = material.getAlphaTestTexture();
            const needAlphaBlendFromDiffuse =
                diffuseTexture && diffuseTexture.hasAlpha && ((material as any).useAlphaFromDiffuseTexture || (material as any)._useAlphaFromAlbedoTexture);

            if (diffuseTexture && (needAlphaTest || needAlphaBlendFromDiffuse)) {
                defines.push("#define DIFFUSE");
                if (mesh.isVerticesDataPresent(VertexBuffer.UV2Kind) && diffuseTexture.coordinatesIndex === 1) {
                    defines.push("#define DIFFUSEUV2");
                    uv2 = true;
                } else if (mesh.isVerticesDataPresent(VertexBuffer.UVKind)) {
                    defines.push("#define DIFFUSEUV1");
                    uv1 = true;
                }

                if (needAlphaTest) {
                    defines.push("#define ALPHATEST");
                    defines.push("#define ALPHATESTVALUE 0.4");
                }
                if (!diffuseTexture.gammaSpace) {
                    defines.push("#define DIFFUSE_ISLINEAR");
                }
            }

            const opacityTexture = (material as any).opacityTexture;
            if (opacityTexture) {
                defines.push("#define OPACITY");
                if (mesh.isVerticesDataPresent(VertexBuffer.UV2Kind) && opacityTexture.coordinatesIndex === 1) {
                    defines.push("#define OPACITYUV2");
                    uv2 = true;
                } else if (mesh.isVerticesDataPresent(VertexBuffer.UVKind)) {
                    defines.push("#define OPACITYUV1");
                    uv1 = true;
                }
            }
        }

        // Emissive
        if (emissiveTexture) {
            defines.push("#define EMISSIVE");
            if (mesh.isVerticesDataPresent(VertexBuffer.UV2Kind) && emissiveTexture.coordinatesIndex === 1) {
                defines.push("#define EMISSIVEUV2");
                uv2 = true;
            } else if (mesh.isVerticesDataPresent(VertexBuffer.UVKind)) {
                defines.push("#define EMISSIVEUV1");
                uv1 = true;
            }
            if (!emissiveTexture.gammaSpace) {
                defines.push("#define EMISSIVE_ISLINEAR");
            }
        }

        // Vertex
        if (mesh.useVertexColors && mesh.isVerticesDataPresent(VertexBuffer.ColorKind) && mesh.hasVertexAlpha && material.transparencyMode !== Material.MATERIAL_OPAQUE) {
            attribs.push(VertexBuffer.ColorKind);
            defines.push("#define VERTEXALPHA");
        }

        if (uv1) {
            attribs.push(VertexBuffer.UVKind);
            defines.push("#define UV1");
        }
        if (uv2) {
            attribs.push(VertexBuffer.UV2Kind);
            defines.push("#define UV2");
        }

        // Bones
        const fallbacks = new EffectFallbacks();
        if (mesh.useBones && mesh.computeBonesUsingShaders) {
            attribs.push(VertexBuffer.MatricesIndicesKind);
            attribs.push(VertexBuffer.MatricesWeightsKind);
            if (mesh.numBoneInfluencers > 4) {
                attribs.push(VertexBuffer.MatricesIndicesExtraKind);
                attribs.push(VertexBuffer.MatricesWeightsExtraKind);
            }

            defines.push("#define NUM_BONE_INFLUENCERS " + mesh.numBoneInfluencers);

            const skeleton = mesh.skeleton;
            if (skeleton && skeleton.isUsingTextureForMatrices) {
                defines.push("#define BONETEXTURE");
            } else {
                defines.push("#define BonesPerMesh " + (skeleton ? skeleton.bones.length + 1 : 0));
            }

            if (mesh.numBoneInfluencers > 0) {
                fallbacks.addCPUSkinningFallback(0, mesh);
            }
        } else {
            defines.push("#define NUM_BONE_INFLUENCERS 0");
        }

        // Morph targets
        const numMorphInfluencers = mesh.morphTargetManager
            ? PrepareDefinesAndAttributesForMorphTargets(
                  mesh.morphTargetManager,
                  defines,
                  attribs,
                  mesh,
                  true, // usePositionMorph
                  false, // useNormalMorph
                  false, // useTangentMorph
                  uv1, // useUVMorph
                  uv2, // useUV2Morph
                  color // useColorMorph
              )
            : 0;

        // Instances
        if (useInstances) {
            defines.push("#define INSTANCES");
            PushAttributesForInstances(attribs);
            if (subMesh.getRenderingMesh().hasThinInstances) {
                defines.push("#define THIN_INSTANCES");
            }
        }

        // Baked vertex animations
        const bvaManager = mesh.bakedVertexAnimationManager;
        if (bvaManager && bvaManager.isEnabled) {
            defines.push("#define BAKED_VERTEX_ANIMATION_TEXTURE");
            if (useInstances) {
                attribs.push("bakedVertexAnimationSettingsInstanced");
            }
        }

        // ClipPlanes
        PrepareStringDefinesForClipPlanes(material, this._scene, defines);

        this._addCustomEffectDefines(defines);

        // Get correct effect
        const drawWrapper = subMesh._getDrawWrapper(undefined, true)!;
        const cachedDefines = drawWrapper.defines as string;
        const join = defines.join("\n");
        if (cachedDefines !== join) {
            const uniforms = [
                "world",
                "mBones",
                "viewProjection",
                "glowColor",
                "morphTargetInfluences",
                "morphTargetCount",
                "boneTextureWidth",
                "diffuseMatrix",
                "emissiveMatrix",
                "opacityMatrix",
                "opacityIntensity",
                "morphTargetTextureInfo",
                "morphTargetTextureIndices",
                "bakedVertexAnimationSettings",
                "bakedVertexAnimationTextureSizeInverted",
                "bakedVertexAnimationTime",
                "bakedVertexAnimationTexture",
                "glowIntensity",
            ];

            AddClipPlaneUniforms(uniforms);

            drawWrapper.setEffect(
                this._engine.createEffect(
                    "glowMapGeneration",
                    attribs,
                    uniforms,
                    ["diffuseSampler", "emissiveSampler", "opacitySampler", "boneSampler", "morphTargets", "bakedVertexAnimationTexture"],
                    join,
                    fallbacks,
                    undefined,
                    undefined,
                    { maxSimultaneousMorphTargets: numMorphInfluencers },
                    this._shaderLanguage,
                    this._shadersLoaded
                        ? undefined
                        : async () => {
                              await this._importShadersAsync();
                              this._shadersLoaded = true;
                          }
                ),
                join
            );
        }

        const effectIsReady = drawWrapper.effect!.isReady();

        return effectIsReady && (this._dontCheckIfReady || (!this._dontCheckIfReady && this.isLayerReady()));
    }

    /** @internal */
    public _isSubMeshReady(subMesh: SubMesh, useInstances: boolean, emissiveTexture: Nullable<BaseTexture>): boolean {
        return this._internalIsSubMeshReady(subMesh, useInstances, emissiveTexture);
    }

    protected async _importShadersAsync(): Promise<void> {
        if (this._shaderLanguage === ShaderLanguage.WGSL) {
            await Promise.all([import("../ShadersWGSL/glowMapGeneration.vertex"), import("../ShadersWGSL/glowMapGeneration.fragment")]);
        } else {
            await Promise.all([import("../Shaders/glowMapGeneration.vertex"), import("../Shaders/glowMapGeneration.fragment")]);
        }
        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        this._additionalImportShadersAsync?.();
    }

    /** @internal */
    public _internalIsLayerReady(): boolean {
        let isReady = true;

        for (let i = 0; i < this._postProcesses.length; i++) {
            isReady = this._postProcesses[i].isReady() && isReady;
        }

        const numDraws = this._numInternalDraws();

        for (let i = 0; i < numDraws; ++i) {
            let currentEffect = this._mergeDrawWrapper[i];
            if (!currentEffect) {
                currentEffect = this._mergeDrawWrapper[i] = new DrawWrapper(this._engine);
                currentEffect.setEffect(this._createMergeEffect());
            }
            isReady = currentEffect.effect!.isReady() && isReady;
        }

        return isReady;
    }

    /**
     * Checks if the layer is ready to be used.
     * @returns true if the layer is ready to be used
     */
    public isLayerReady(): boolean {
        return this._internalIsLayerReady();
    }

    /**
     * Renders the glowing part of the scene by blending the blurred glowing meshes on top of the rendered scene.
     * @returns true if the rendering was successful
     */
    public compose(): boolean {
        if (!this._dontCheckIfReady && !this.isLayerReady()) {
            return false;
        }

        const engine = this._scene.getEngine();
        const numDraws = this._numInternalDraws();

        this.onBeforeComposeObservable.notifyObservers(this);

        const previousAlphaMode = engine.getAlphaMode();

        for (let i = 0; i < numDraws; ++i) {
            const currentEffect = this._mergeDrawWrapper[i];

            // Render
            engine.enableEffect(currentEffect);
            engine.setState(false);

            // VBOs
            engine.bindBuffers(this._vertexBuffers, this._indexBuffer, currentEffect.effect!);

            // Go Blend.
            engine.setAlphaMode(this._options.alphaBlendingMode);

            // Blends the map on the main canvas.
            this._internalCompose(currentEffect.effect!, i);
        }

        // Restore Alpha
        engine.setAlphaMode(previousAlphaMode);

        this.onAfterComposeObservable.notifyObservers(this);

        return true;
    }

    /** @internal */
    public _internalHasMesh(mesh: AbstractMesh): boolean {
        if (this.renderingGroupId === -1 || mesh.renderingGroupId === this.renderingGroupId) {
            return true;
        }
        return false;
    }

    /**
     * Determine if a given mesh will be used in the current effect.
     * @param mesh mesh to test
     * @returns true if the mesh will be used
     */
    public hasMesh(mesh: AbstractMesh): boolean {
        return this._internalHasMesh(mesh);
    }

    /** @internal */
    public _internalShouldRender(): boolean {
        return this.isEnabled && this._shouldRender;
    }

    /**
     * Returns true if the layer contains information to display, otherwise false.
     * @returns true if the glow layer should be rendered
     */
    public shouldRender(): boolean {
        return this._internalShouldRender();
    }

    /** @internal */
    public _shouldRenderMesh(_mesh: AbstractMesh): boolean {
        return true;
    }

    /** @internal */
    public _internalCanRenderMesh(mesh: AbstractMesh, material: Material): boolean {
        return !material.needAlphaBlendingForMesh(mesh);
    }

    /** @internal */
    public _canRenderMesh(mesh: AbstractMesh, material: Material): boolean {
        return this._internalCanRenderMesh(mesh, material);
    }

    protected _renderSubMesh(subMesh: SubMesh, enableAlphaMode: boolean = false): void {
        if (!this._internalShouldRender()) {
            return;
        }

        const material = subMesh.getMaterial();
        const ownerMesh = subMesh.getMesh();
        const replacementMesh = subMesh.getReplacementMesh();
        const renderingMesh = subMesh.getRenderingMesh();
        const effectiveMesh = subMesh.getEffectiveMesh();
        const scene = this._scene;
        const engine = scene.getEngine();

        effectiveMesh._internalAbstractMeshDataInfo._isActiveIntermediate = false;

        if (!material) {
            return;
        }

        // Do not block in blend mode.
        if (!this._canRenderMesh(renderingMesh, material)) {
            return;
        }

        // Culling
        let sideOrientation = material._getEffectiveOrientation(renderingMesh);
        const mainDeterminant = effectiveMesh._getWorldMatrixDeterminant();
        if (mainDeterminant < 0) {
            sideOrientation = sideOrientation === Material.ClockWiseSideOrientation ? Material.CounterClockWiseSideOrientation : Material.ClockWiseSideOrientation;
        }

        const reverse = sideOrientation === Material.ClockWiseSideOrientation;
        engine.setState(material.backFaceCulling, material.zOffset, undefined, reverse, material.cullBackFaces, undefined, material.zOffsetUnits);

        // Managing instances
        const batch = renderingMesh._getInstancesRenderList(subMesh._id, !!replacementMesh);
        if (batch.mustReturn) {
            return;
        }

        // Early Exit per mesh
        if (!this._shouldRenderMesh(renderingMesh)) {
            return;
        }

        const hardwareInstancedRendering = batch.hardwareInstancedRendering[subMesh._id] || renderingMesh.hasThinInstances;

        this._setEmissiveTextureAndColor(renderingMesh, subMesh, material);

        this.onBeforeRenderMeshToEffect.notifyObservers(ownerMesh);

        if (this._useMeshMaterial(renderingMesh)) {
            subMesh.getMaterial()!._glowModeEnabled = true;
            renderingMesh.render(subMesh, enableAlphaMode, replacementMesh || undefined);
            subMesh.getMaterial()!._glowModeEnabled = false;
        } else if (this._isSubMeshReady(subMesh, hardwareInstancedRendering, this._emissiveTextureAndColor.texture)) {
            const renderingMaterial = effectiveMesh._internalAbstractMeshDataInfo._materialForRenderPass?.[engine.currentRenderPassId];

            let drawWrapper = subMesh._getDrawWrapper();
            if (!drawWrapper && renderingMaterial) {
                drawWrapper = renderingMaterial._getDrawWrapper();
            }

            if (!drawWrapper) {
                return;
            }

            const effect = drawWrapper.effect!;

            engine.enableEffect(drawWrapper);
            if (!hardwareInstancedRendering) {
                renderingMesh._bind(subMesh, effect, material.fillMode);
            }

            if (!renderingMaterial) {
                effect.setMatrix("viewProjection", scene.getTransformMatrix());
                effect.setMatrix("world", effectiveMesh.getWorldMatrix());
                effect.setFloat4(
                    "glowColor",
                    this._emissiveTextureAndColor.color.r,
                    this._emissiveTextureAndColor.color.g,
                    this._emissiveTextureAndColor.color.b,
                    this._emissiveTextureAndColor.color.a
                );
            } else {
                renderingMaterial.bindForSubMesh(effectiveMesh.getWorldMatrix(), effectiveMesh as Mesh, subMesh);
            }

            if (!renderingMaterial) {
                const needAlphaTest = material.needAlphaTestingForMesh(effectiveMesh);

                const diffuseTexture = material.getAlphaTestTexture();
                const needAlphaBlendFromDiffuse =
                    diffuseTexture && diffuseTexture.hasAlpha && ((material as any).useAlphaFromDiffuseTexture || (material as any)._useAlphaFromAlbedoTexture);

                if (diffuseTexture && (needAlphaTest || needAlphaBlendFromDiffuse)) {
                    effect.setTexture("diffuseSampler", diffuseTexture);
                    const textureMatrix = diffuseTexture.getTextureMatrix();

                    if (textureMatrix) {
                        effect.setMatrix("diffuseMatrix", textureMatrix);
                    }
                }

                const opacityTexture = (material as any).opacityTexture;
                if (opacityTexture) {
                    effect.setTexture("opacitySampler", opacityTexture);
                    effect.setFloat("opacityIntensity", opacityTexture.level);
                    const textureMatrix = opacityTexture.getTextureMatrix();
                    if (textureMatrix) {
                        effect.setMatrix("opacityMatrix", textureMatrix);
                    }
                }

                // Glow emissive only
                if (this._emissiveTextureAndColor.texture) {
                    effect.setTexture("emissiveSampler", this._emissiveTextureAndColor.texture);
                    effect.setMatrix("emissiveMatrix", this._emissiveTextureAndColor.texture.getTextureMatrix());
                }

                // Bones
                BindBonesParameters(renderingMesh, effect);

                // Morph targets
                BindMorphTargetParameters(renderingMesh, effect);
                if (renderingMesh.morphTargetManager && renderingMesh.morphTargetManager.isUsingTextureForTargets) {
                    renderingMesh.morphTargetManager._bind(effect);
                }

                // Baked vertex animations
                const bvaManager = subMesh.getMesh().bakedVertexAnimationManager;
                if (bvaManager && bvaManager.isEnabled) {
                    bvaManager.bind(effect, hardwareInstancedRendering);
                }

                // Alpha mode
                if (enableAlphaMode) {
                    engine.setAlphaMode(material.alphaMode);
                }

                // Intensity of effect
                effect.setFloat("glowIntensity", this.getEffectIntensity(renderingMesh));

                // Clip planes
                BindClipPlane(effect, material, scene);
            }

            // Draw
            renderingMesh._processRendering(effectiveMesh, subMesh, effect, material.fillMode, batch, hardwareInstancedRendering, (isInstance, world) =>
                effect.setMatrix("world", world)
            );
        } else {
            // Need to reset refresh rate of the main map
            this._objectRenderer.resetRefreshCounter();
        }

        this.onAfterRenderMeshToEffect.notifyObservers(ownerMesh);
    }

    /** @internal */
    public _useMeshMaterial(_mesh: AbstractMesh): boolean {
        return false;
    }

    /** @internal */
    public _rebuild(): void {
        const vb = this._vertexBuffers[VertexBuffer.PositionKind];

        if (vb) {
            vb._rebuild();
        }

        this._generateIndexBuffer();
    }

    /**
     * Dispose the effect layer and free resources.
     */
    public dispose(): void {
        const vertexBuffer = this._vertexBuffers[VertexBuffer.PositionKind];
        if (vertexBuffer) {
            vertexBuffer.dispose();
            this._vertexBuffers[VertexBuffer.PositionKind] = null;
        }

        if (this._indexBuffer) {
            this._scene.getEngine()._releaseBuffer(this._indexBuffer);
            this._indexBuffer = null;
        }

        for (const drawWrapper of this._mergeDrawWrapper) {
            drawWrapper.dispose();
        }
        this._mergeDrawWrapper = [];

        this._objectRenderer.dispose();

        // Callback
        this.onDisposeObservable.notifyObservers(this);

        this.onDisposeObservable.clear();
        this.onBeforeRenderLayerObservable.clear();
        this.onBeforeComposeObservable.clear();
        this.onBeforeRenderMeshToEffect.clear();
        this.onAfterRenderMeshToEffect.clear();
        this.onAfterComposeObservable.clear();
    }
}
