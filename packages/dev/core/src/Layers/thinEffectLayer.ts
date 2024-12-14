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
import type { EffectWrapper } from "core/Materials/effectRenderer";
import type { BaseTexture } from "../Materials/Textures/baseTexture";
import type { Effect } from "../Materials/effect";
import { Material } from "../Materials/material";
import { Constants } from "../Engines/constants";

import type { DataBuffer } from "../Buffers/dataBuffer";
import { EffectFallbacks } from "../Materials/effectFallbacks";
import { DrawWrapper } from "../Materials/drawWrapper";
import { addClipPlaneUniforms, bindClipPlane, prepareStringDefinesForClipPlanes } from "../Materials/clipPlaneMaterialHelper";
import { BindMorphTargetParameters, PrepareAttributesForMorphTargetsInfluencers, PushAttributesForInstances } from "../Materials/materialHelper.functions";
import { ShaderLanguage } from "core/Materials/shaderLanguage";
import { ObjectRenderer } from "core/Rendering/objectRenderer";

/**
 * Effect layer options. This helps customizing the behaviour
 * of the effect layer.
 */
export interface IThinEffectLayerOptions {
    /**
     * Alpha blending mode used to apply the blur. Default depends of the implementation. Default: ALPHA_COMBINE
     */
    alphaBlendingMode?: number;

    /**
     * The camera attached to the layer. Default: null
     */
    camera: Nullable<Camera>;

    /**
     * The rendering group to draw the layer in. Default: -1
     */
    renderingGroupId: number;
}

/**
 * The effect layer Helps adding post process effect blended with the main pass.
 *
 * This can be for instance use to generate glow or highlight effects on the scene.
 *
 * The effect layer class can not be used directly and is intented to inherited from to be
 * customized per effects.
 */
export abstract class ThinEffectLayer {
    private _vertexBuffers: { [key: string]: Nullable<VertexBuffer> } = {};
    private _indexBuffer: Nullable<DataBuffer>;
    private _mergeDrawWrapper: DrawWrapper[];
    private _dontCheckIfReady = false;

    protected _scene: Scene;
    protected _engine: AbstractEngine;
    protected _options: Required<IThinEffectLayerOptions>;
    protected _objectRenderer: ObjectRenderer;
    protected _shouldRender = true;
    protected _emissiveTextureAndColor: { texture: Nullable<BaseTexture>; color: Color4 } = { texture: null, color: new Color4() };
    protected _effectIntensity: { [meshUniqueId: number]: number } = {};

    public postProcesses: EffectWrapper[] = [];

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
     * Gets the main texture where the effect is rendered
     */
    public get objectRenderer() {
        return this._objectRenderer;
    }

    /** Shader language used by the material */
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
     * Instantiates a new effect Layer and references it in the scene.
     * @param name The name of the layer
     * @param scene The scene to use the layer in
     * @param forceGLSL Use the GLSL code generation for the shader (even on WebGPU). Default is false
     * @param dontCheckIfReady Specifies if the layer should disable checking whether all the post processes are ready (default: false). To save performance, this should be set to false and you should call `isReady` manually before rendering to the layer.
     */
    constructor(name: string, scene?: Scene, forceGLSL = false, dontCheckIfReady = false) {
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

    protected _shadersLoaded = false;

    /**
     * Get the effect name of the layer.
     * @returns The effect name
     */
    public abstract getEffectName(): string;

    /**
     * Checks for the readiness of the element composing the layer.
     * @param subMesh the mesh to check for
     * @param useInstances specify whether or not to use instances to render the mesh
     * @returns true if ready otherwise, false
     */
    public abstract isSubMeshReady(subMesh: SubMesh, useInstances: boolean): boolean;

    /**
     * Create the merge effect. This is the shader use to blit the information back
     * to the main canvas at the end of the scene rendering.
     * @returns The effect containing the shader used to merge the effect on the  main canvas
     */
    protected abstract _createMergeEffect(): Effect;

    /**
     * Creates the render target textures and post processes used in the effect layer.
     */
    protected abstract _createTextureAndPostProcesses(): void;

    /**
     * Implementation specific of rendering the generating effect on the main canvas.
     * @param effect The effect used to render through
     * @param renderNum Index of the _internalRender call (0 for the first time _internalRender is called, 1 for the second time, etc. _internalRender is called the number of times returned by _numInternalDraws())
     */
    protected abstract _internalCompose(effect: Effect, renderIndex: number): void;

    /**
     * Sets the required values for both the emissive texture and and the main color.
     */
    protected abstract _setEmissiveTextureAndColor(mesh: Mesh, subMesh: SubMesh, material: Material): void;

    /**
     * Number of times _internalRender will be called. Some effect layers need to render the mesh several times, so they should override this method with the number of times the mesh should be rendered
     * @returns Number of times a mesh must be rendered in the layer
     */
    protected _numInternalDraws(): number {
        return 1;
    }

    /**
     * Initializes the effect layer with the required options.
     * @param options Sets of none mandatory options to use with the layer (see IEffectLayerOptions for more information)
     */
    protected _init(options: Partial<IThinEffectLayerOptions>): void {
        // Adapt options
        this._options = {
            alphaBlendingMode: Constants.ALPHA_COMBINE,
            camera: null,
            renderingGroupId: -1,
            ...options,
        };

        this._createObjectRenderer();
        this._createTextureAndPostProcesses();
    }

    /**
     * Generates the index buffer of the full screen quad blending to the main canvas.
     */
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

    /**
     * Generates the vertex buffer of the full screen quad blending to the main canvas.
     */
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

    /**
     * Creates the main texture for the effect layer.
     */
    protected _createObjectRenderer(): void {
        this._objectRenderer = new ObjectRenderer(`ObjectRenderer for effect layer ${this.name}`, this._scene, {
            doNotChangeAspectRatio: true,
        });
        this._objectRenderer.activeCamera = this._options.camera;
        this._objectRenderer.renderParticles = false;
        this._objectRenderer.renderList = null;

        for (const id in this._materialForRendering) {
            const [mesh, material] = this._materialForRendering[id];
            this._objectRenderer.setMaterialForRendering(mesh, material);
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

    public renderLayer(viewportWidth: number, viewportHeight: number): void {
        const hasBoundingBoxRenderer = !!this._scene.getBoundingBoxRenderer;

        let boundingBoxRendererEnabled = false;

        this._scene.incrementRenderId();
        this._scene.resetCachedMaterial();

        this._objectRenderer.prepareRenderList();

        // Prevent package size in es6 (getBoundingBoxRenderer might not be present)
        if (hasBoundingBoxRenderer) {
            boundingBoxRendererEnabled = this._scene.getBoundingBoxRenderer().enabled;

            this._scene.getBoundingBoxRenderer().enabled = !this.disableBoundingBoxesFromEffectLayer && boundingBoxRendererEnabled;
        }

        this._objectRenderer.initRender(viewportWidth, viewportHeight);

        this._objectRenderer.render();

        if (hasBoundingBoxRenderer) {
            this._scene.getBoundingBoxRenderer().enabled = boundingBoxRendererEnabled;
        }

        this._objectRenderer.finishRender();
    }

    /**
     * Adds specific effects defines.
     * @param defines The defines to add specifics to.
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    protected _addCustomEffectDefines(defines: string[]): void {
        // Nothing to add by default.
    }

    /**
     * Checks for the readiness of the element composing the layer.
     * @param subMesh the mesh to check for
     * @param useInstances specify whether or not to use instances to render the mesh
     * @param emissiveTexture the associated emissive texture used to generate the glow
     * @returns true if ready otherwise, false
     */
    protected _isSubMeshReady(subMesh: SubMesh, useInstances: boolean, emissiveTexture: Nullable<BaseTexture>): boolean {
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

        // Diffuse
        if (material) {
            const needAlphaTest = material.needAlphaTesting();

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
        const manager = (<Mesh>mesh).morphTargetManager;
        let morphInfluencers = 0;
        if (manager) {
            morphInfluencers = manager.numMaxInfluencers || manager.numInfluencers;
            if (morphInfluencers > 0) {
                defines.push("#define MORPHTARGETS");
                defines.push("#define NUM_MORPH_INFLUENCERS " + morphInfluencers);
                if (manager.isUsingTextureForTargets) {
                    defines.push("#define MORPHTARGETS_TEXTURE");
                }
                PrepareAttributesForMorphTargetsInfluencers(attribs, mesh, morphInfluencers);
            }
        }

        // Instances
        if (useInstances) {
            defines.push("#define INSTANCES");
            PushAttributesForInstances(attribs);
            if (subMesh.getRenderingMesh().hasThinInstances) {
                defines.push("#define THIN_INSTANCES");
            }
        }

        // ClipPlanes
        prepareStringDefinesForClipPlanes(material, this._scene, defines);

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
                "glowIntensity",
            ];

            addClipPlaneUniforms(uniforms);

            drawWrapper.setEffect(
                this._engine.createEffect(
                    "glowMapGeneration",
                    attribs,
                    uniforms,
                    ["diffuseSampler", "emissiveSampler", "opacitySampler", "boneSampler", "morphTargets"],
                    join,
                    fallbacks,
                    undefined,
                    undefined,
                    { maxSimultaneousMorphTargets: morphInfluencers },
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

        return effectIsReady && (this._dontCheckIfReady || (!this._dontCheckIfReady && this.isReady()));
    }

    protected async _importShadersAsync(): Promise<void> {
        if (this._shaderLanguage === ShaderLanguage.WGSL) {
            await Promise.all([import("../ShadersWGSL/glowMapGeneration.vertex"), import("../ShadersWGSL/glowMapGeneration.fragment")]);
        } else {
            await Promise.all([import("../Shaders/glowMapGeneration.vertex"), import("../Shaders/glowMapGeneration.fragment")]);
        }
    }

    public isReady(): boolean {
        let isReady = true;

        for (let i = 0; i < this.postProcesses.length; i++) {
            isReady = this.postProcesses[i].isReady() && isReady;
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
     * Renders the glowing part of the scene by blending the blurred glowing meshes on top of the rendered scene.
     */
    public compose(): void {
        if (!this._dontCheckIfReady && !this.isReady()) {
            return;
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
    }

    /**
     * Determine if a given mesh will be used in the current effect.
     * @param mesh mesh to test
     * @returns true if the mesh will be used
     */
    public hasMesh(mesh: AbstractMesh): boolean {
        if (this.renderingGroupId === -1 || mesh.renderingGroupId === this.renderingGroupId) {
            return true;
        }
        return false;
    }

    /**
     * Returns true if the layer contains information to display, otherwise false.
     * @returns true if the glow layer should be rendered
     */
    public shouldRender(): boolean {
        return this.isEnabled && this._shouldRender;
    }

    /**
     * Returns true if the mesh should render, otherwise false.
     * @param mesh The mesh to render
     * @returns true if it should render otherwise false
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    protected _shouldRenderMesh(mesh: AbstractMesh): boolean {
        return true;
    }

    /**
     * Returns true if the mesh can be rendered, otherwise false.
     * @param mesh The mesh to render
     * @param material The material used on the mesh
     * @returns true if it can be rendered otherwise false
     */
    protected _canRenderMesh(mesh: AbstractMesh, material: Material): boolean {
        return !material.needAlphaBlendingForMesh(mesh);
    }

    /**
     * Returns true if the mesh should render, otherwise false.
     * @returns true if it should render otherwise false
     */
    protected _shouldRenderEmissiveTextureForMesh(): boolean {
        return true;
    }

    /**
     * Renders the submesh passed in parameter to the generation map.
     * @param subMesh
     * @param enableAlphaMode
     */
    protected _renderSubMesh(subMesh: SubMesh, enableAlphaMode: boolean = false): void {
        if (!this.shouldRender()) {
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
            renderingMesh.render(subMesh, enableAlphaMode, replacementMesh || undefined);
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
                const needAlphaTest = material.needAlphaTesting();

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
                if (renderingMesh.useBones && renderingMesh.computeBonesUsingShaders && renderingMesh.skeleton) {
                    const skeleton = renderingMesh.skeleton;

                    if (skeleton.isUsingTextureForMatrices) {
                        const boneTexture = skeleton.getTransformMatrixTexture(renderingMesh);
                        if (!boneTexture) {
                            return;
                        }

                        effect.setTexture("boneSampler", boneTexture);
                        effect.setFloat("boneTextureWidth", 4.0 * (skeleton.bones.length + 1));
                    } else {
                        effect.setMatrices("mBones", skeleton.getTransformMatrices(renderingMesh));
                    }
                }

                // Morph targets
                BindMorphTargetParameters(renderingMesh, effect);
                if (renderingMesh.morphTargetManager && renderingMesh.morphTargetManager.isUsingTextureForTargets) {
                    renderingMesh.morphTargetManager._bind(effect);
                }

                // Alpha mode
                if (enableAlphaMode) {
                    engine.setAlphaMode(material.alphaMode);
                }

                // Intensity of effect
                effect.setFloat("glowIntensity", this.getEffectIntensity(renderingMesh));

                // Clip planes
                bindClipPlane(effect, material, scene);
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

    /**
     * Defines whether the current material of the mesh should be use to render the effect.
     * @param mesh defines the current mesh to render
     * @returns true if the mesh material should be use
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    protected _useMeshMaterial(mesh: AbstractMesh): boolean {
        return false;
    }

    /**
     * Rebuild the required buffers.
     * @internal Internal use only.
     */
    public _rebuild(): void {
        const vb = this._vertexBuffers[VertexBuffer.PositionKind];

        if (vb) {
            vb._rebuild();
        }

        this._generateIndexBuffer();
    }

    /**
     * Dispose the highlight layer and free resources.
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
