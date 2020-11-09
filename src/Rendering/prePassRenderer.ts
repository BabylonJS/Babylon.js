import { MultiRenderTarget } from "../Materials/Textures/multiRenderTarget";
import { Scene } from "../scene";
import { Engine } from "../Engines/engine";
import { Constants } from "../Engines/constants";
import { ImageProcessingPostProcess } from "../PostProcesses/imageProcessingPostProcess";
import { PostProcess } from "../PostProcesses/postProcess";
import { Effect } from "../Materials/effect";
import { _DevTools } from '../Misc/devTools';
import { Color4 } from "../Maths/math.color";
import { PrePassEffectConfiguration } from "./prePassEffectConfiguration";
import { Nullable } from "../types";
import { AbstractMesh } from '../Meshes/abstractMesh';
import { Material } from '../Materials/material';
import { SubMesh } from '../Meshes/subMesh';
import { GeometryBufferRenderer } from '../Rendering/geometryBufferRenderer';

/**
 * Renders a pre pass of the scene
 * This means every mesh in the scene will be rendered to a render target texture
 * And then this texture will be composited to the rendering canvas with post processes
 * It is necessary for effects like subsurface scattering or deferred shading
 */
export class PrePassRenderer {
    /** @hidden */
    public static _SceneComponentInitialization: (scene: Scene) => void = (_) => {
        throw _DevTools.WarnImport("PrePassRendererSceneComponent");
    }

    private _textureFormats = [
        {
            type: Constants.PREPASS_IRRADIANCE_TEXTURE_TYPE,
            format: Constants.TEXTURETYPE_HALF_FLOAT,
        },
        {
            type: Constants.PREPASS_POSITION_TEXTURE_TYPE,
            format: Constants.TEXTURETYPE_HALF_FLOAT,
        },
        {
            type: Constants.PREPASS_VELOCITY_TEXTURE_TYPE,
            format: Constants.TEXTURETYPE_HALF_FLOAT,
        },
        {
            type: Constants.PREPASS_REFLECTIVITY_TEXTURE_TYPE,
            format: Constants.TEXTURETYPE_UNSIGNED_INT,
        },
        {
            type: Constants.PREPASS_COLOR_TEXTURE_TYPE,
            format: Constants.TEXTURETYPE_HALF_FLOAT,
        },
        {
            type: Constants.PREPASS_DEPTHNORMAL_TEXTURE_TYPE,
            format: Constants.TEXTURETYPE_HALF_FLOAT,
        },
        {
            type: Constants.PREPASS_ALBEDO_TEXTURE_TYPE,
            format: Constants.TEXTURETYPE_UNSIGNED_INT,
        },
    ];

    /**
     * To save performance, we can excluded skinned meshes from the prepass
     */
    public excludedSkinnedMesh: AbstractMesh[] = [];

    /**
     * Force material to be excluded from the prepass
     * Can be useful when `useGeometryBufferFallback` is set to `true`
     * and you don't want a material to show in the effect.
     */
    public excludedMaterials: Material[] = [];

    private _textureIndices: number[] = [];

    private _scene: Scene;
    private _engine: Engine;
    private _isDirty: boolean = false;

    /**
     * Number of textures in the multi render target texture where the scene is directly rendered
     */
    public mrtCount: number = 0;

    /**
     * The render target where the scene is directly rendered
     */
    public prePassRT: MultiRenderTarget;

    private _multiRenderAttachments: number[];
    private _defaultAttachments: number[];
    private _clearAttachments: number[];

    private _postProcesses: PostProcess[] = [];

    private readonly _clearColor = new Color4(0, 0, 0, 0);

    /**
     * Image processing post process for composition
     */
    public imageProcessingPostProcess: ImageProcessingPostProcess;

    /**
     * Configuration for prepass effects
     */
    private _effectConfigurations: PrePassEffectConfiguration[] = [];

    private _mrtFormats: number[] = [];
    private _mrtLayout: number[];

    private _enabled: boolean = false;

    /**
     * Indicates if the prepass is enabled
     */
    public get enabled() {
        return this._enabled;
    }

    /**
     * How many samples are used for MSAA of the scene render target
     */
    public get samples() {
        return this.prePassRT.samples;
    }

    public set samples(n: number) {
        if (!this.imageProcessingPostProcess) {
            this._createCompositionEffect();
        }

        this.prePassRT.samples = n;
    }

    private _geometryBuffer: Nullable<GeometryBufferRenderer>;
    private _useGeometryBufferFallback = false;
    /**
     * Uses the geometry buffer renderer as a fallback for non prepass capable effects
     */
    public get useGeometryBufferFallback() : boolean {
        return this._useGeometryBufferFallback;
    }

    public set useGeometryBufferFallback(value: boolean) {
        this._useGeometryBufferFallback = value;

        if (value) {
            this._geometryBuffer = this._scene.enableGeometryBufferRenderer();

            if (!this._geometryBuffer) {
                // Not supported
                this._useGeometryBufferFallback = false;
                return;
            }

            this._geometryBuffer.renderList = [];
            this._geometryBuffer._linkPrePassRenderer(this);
            this._updateGeometryBufferLayout();
        } else {
            if (this._geometryBuffer) {
                this._geometryBuffer._unlinkPrePassRenderer();
            }
            this._geometryBuffer = null;
            this._scene.disableGeometryBufferRenderer();
        }
    }

    /**
     * Set to true to disable gamma transform in PrePass.
     * Can be useful in case you already proceed to gamma transform on a material level
     * and your post processes don't need to be in linear color space.
     */
    public disableGammaTransform = false;

    /**
     * Instanciates a prepass renderer
     * @param scene The scene
     */
    constructor(scene: Scene) {
        this._scene = scene;
        this._engine = scene.getEngine();

        PrePassRenderer._SceneComponentInitialization(this._scene);
        this._resetLayout();
    }

    private _initializeAttachments() {
        const multiRenderLayout = [];
        const clearLayout = [false];
        const defaultLayout = [true];

        for (let i = 0; i < this.mrtCount; i++) {
            multiRenderLayout.push(true);

            if (i > 0) {
                clearLayout.push(true);
                defaultLayout.push(false);
            }
        }

        this._multiRenderAttachments = this._engine.buildTextureLayout(multiRenderLayout);
        this._clearAttachments = this._engine.buildTextureLayout(clearLayout);
        this._defaultAttachments = this._engine.buildTextureLayout(defaultLayout);
    }

    private _createCompositionEffect() {
        this.prePassRT = new MultiRenderTarget("sceneprePassRT", { width: this._engine.getRenderWidth(), height: this._engine.getRenderHeight() }, this.mrtCount, this._scene,
            { generateMipMaps: false, generateDepthTexture: true, defaultType: Constants.TEXTURETYPE_UNSIGNED_INT, types: this._mrtFormats });
        this.prePassRT.samples = 1;

        this._initializeAttachments();
        if (this._useGeometryBufferFallback && !this._geometryBuffer) {
            // Initializes the link with geometry buffer
            this.useGeometryBufferFallback = true;
        }

        this.imageProcessingPostProcess = new ImageProcessingPostProcess("sceneCompositionPass", 1, null, undefined, this._engine);
        this.imageProcessingPostProcess.autoClear = false;
    }

    /**
     * Indicates if rendering a prepass is supported
     */
    public get isSupported() {
        return this._engine.webGLVersion > 1 || this._scene.getEngine().getCaps().drawBuffersExtension;
    }

    /**
     * Sets the proper output textures to draw in the engine.
     * @param effect The effect that is drawn. It can be or not be compatible with drawing to several output textures.
     * @param subMesh Submesh on which the effect is applied
     */
    public bindAttachmentsForEffect(effect: Effect, subMesh: SubMesh) {
        if (this.enabled) {
            if (effect._multiTarget) {
                this._engine.bindAttachments(this._multiRenderAttachments);
            } else {
                this._engine.bindAttachments(this._defaultAttachments);

                if (this._geometryBuffer) {
                    const material = subMesh.getMaterial();
                    if (material && this.excludedMaterials.indexOf(material) === -1) {
                        this._geometryBuffer.renderList!.push(subMesh.getRenderingMesh());
                    }
                }
            }
        }
    }

    /**
     * Restores attachments for single texture draw.
     */
    public restoreAttachments() {
        if (this.enabled && this._defaultAttachments) {
            this._engine.bindAttachments(this._defaultAttachments);
        }
    }

    /**
     * @hidden
     */
    public _beforeCameraDraw() {
        if (this._isDirty) {
            this._update();
        }

        if (this._geometryBuffer) {
            this._geometryBuffer.renderList!.length = 0;
        }

        this._bindFrameBuffer();
    }

    /**
     * @hidden
     */
    public _afterCameraDraw() {
        if (this._enabled) {
            const firstCameraPP = this._scene.activeCamera && this._scene.activeCamera._getFirstPostProcess();
            if (firstCameraPP && this._postProcesses.length) {
                this._scene.postProcessManager._prepareFrame();
            }
            this._scene.postProcessManager.directRender(this._postProcesses, firstCameraPP ? firstCameraPP.inputTexture : null);
        }
    }

    private _checkRTSize() {
        var requiredWidth = this._engine.getRenderWidth(true);
        var requiredHeight = this._engine.getRenderHeight(true);
        var width = this.prePassRT.getRenderWidth();
        var height = this.prePassRT.getRenderHeight();

        if (width !== requiredWidth || height !== requiredHeight) {
            this.prePassRT.resize({ width: requiredWidth, height: requiredHeight });

            this._updateGeometryBufferLayout();
            this._bindPostProcessChain();
        }
    }

    private _bindFrameBuffer() {
        if (this._enabled) {
            this._checkRTSize();
            var internalTexture = this.prePassRT.getInternalTexture();
            if (internalTexture) {
                this._engine.bindFramebuffer(internalTexture);
            }
        }
    }

    /**
     * Clears the scene render target (in the sense of settings pixels to the scene clear color value)
     */
    public clear() {
        if (this._enabled) {
            this._bindFrameBuffer();

            // Regular clear color with the scene clear color of the 1st attachment
            this._engine.clear(this._scene.clearColor,
                this._scene.autoClear || this._scene.forceWireframe || this._scene.forcePointsCloud,
                this._scene.autoClearDepthAndStencil,
                this._scene.autoClearDepthAndStencil);

            // Clearing other attachment with 0 on all other attachments
            this._engine.bindAttachments(this._clearAttachments);
            this._engine.clear(this._clearColor, true, false, false);
            this._engine.bindAttachments(this._defaultAttachments);
        }
    }

    private _setState(enabled: boolean) {
        this._enabled = enabled;
        this._scene.prePass = enabled;

        if (this.imageProcessingPostProcess) {
            this.imageProcessingPostProcess.imageProcessingConfiguration.applyByPostProcess = enabled;
        }
    }

    private _updateGeometryBufferLayout() {
        if (this._geometryBuffer) {
            this._geometryBuffer._resetLayout();

            const texturesActivated = [];

            for (let i = 0; i < this._mrtLayout.length; i++) {
                texturesActivated.push(false);
            }

            this._geometryBuffer._linkInternalTexture(this.prePassRT.getInternalTexture()!);

            const matches = [
                {
                    prePassConstant: Constants.PREPASS_DEPTHNORMAL_TEXTURE_TYPE,
                    geometryBufferConstant: GeometryBufferRenderer.DEPTHNORMAL_TEXTURE_TYPE,
                },
                {
                    prePassConstant: Constants.PREPASS_POSITION_TEXTURE_TYPE,
                    geometryBufferConstant: GeometryBufferRenderer.POSITION_TEXTURE_TYPE,
                },
                {
                    prePassConstant: Constants.PREPASS_REFLECTIVITY_TEXTURE_TYPE,
                    geometryBufferConstant: GeometryBufferRenderer.REFLECTIVITY_TEXTURE_TYPE,
                },
                {
                    prePassConstant: Constants.PREPASS_VELOCITY_TEXTURE_TYPE,
                    geometryBufferConstant: GeometryBufferRenderer.VELOCITY_TEXTURE_TYPE,
                }
            ];

            // replace textures in the geometryBuffer RT
            for (let i = 0; i < matches.length; i++) {
                const index = this._mrtLayout.indexOf(matches[i].prePassConstant);
                if (index !== -1) {
                    this._geometryBuffer._forceTextureType(matches[i].geometryBufferConstant, index);
                    texturesActivated[index] = true;
                }
            }

            this._geometryBuffer._setAttachments(this._engine.buildTextureLayout(texturesActivated));
        }
    }

    /**
     * Adds an effect configuration to the prepass.
     * If an effect has already been added, it won't add it twice and will return the configuration
     * already present.
     * @param cfg the effect configuration
     * @return the effect configuration now used by the prepass
     */
    public addEffectConfiguration(cfg: PrePassEffectConfiguration) : PrePassEffectConfiguration {
        // Do not add twice
        for (let i = 0; i < this._effectConfigurations.length; i++) {
            if (this._effectConfigurations[i].name === cfg.name) {
                return this._effectConfigurations[i];
            }
        }

        this._effectConfigurations.push(cfg);
        return cfg;
    }

    /**
     * Returns the index of a texture in the multi render target texture array.
     * @param type Texture type
     * @return The index
     */
    public getIndex(type: number) : number {
        return this._textureIndices[type];
    }

    private _enable() {
        const previousMrtCount = this.mrtCount;

        for (let i = 0; i < this._effectConfigurations.length; i++) {
            if (this._effectConfigurations[i].enabled) {
                this._enableTextures(this._effectConfigurations[i].texturesRequired);
            }
        }

        if (this.prePassRT && this.mrtCount !== previousMrtCount) {
            this.prePassRT.updateCount(this.mrtCount, { types: this._mrtFormats });
        }

        this._updateGeometryBufferLayout();
        this._resetPostProcessChain();

        for (let i = 0; i < this._effectConfigurations.length; i++) {
            if (this._effectConfigurations[i].enabled) {
                if (!this._effectConfigurations[i].postProcess && this._effectConfigurations[i].createPostProcess) {
                    this._effectConfigurations[i].createPostProcess!();
                }

                if (this._effectConfigurations[i].postProcess) {
                    this._postProcesses.push(this._effectConfigurations[i].postProcess!);
                }
            }
        }

        this._initializeAttachments();

        if (!this.imageProcessingPostProcess) {
            this._createCompositionEffect();
        }

        let isIPPAlreadyPresent = false;
        if (this._scene.activeCamera?._postProcesses) {
            for (let i = 0; i < this._scene.activeCamera._postProcesses.length; i++) {
                if (this._scene.activeCamera._postProcesses[i]?.getClassName() === "ImageProcessingPostProcess") {
                    isIPPAlreadyPresent = true;
                }
            }

        }

        if (!isIPPAlreadyPresent && !this.disableGammaTransform) {
            this._postProcesses.push(this.imageProcessingPostProcess);
        }
        this._bindPostProcessChain();
        this._setState(true);
    }

    private _disable() {
        this._setState(false);
        this._resetLayout();

        for (let i = 0; i < this._effectConfigurations.length; i++) {
            this._effectConfigurations[i].enabled = false;
        }
    }

    private _resetLayout() {
        for (let i = 0 ; i < this._textureFormats.length; i++) {
            this._textureIndices[this._textureFormats[i].type] = -1;
        }

        this._textureIndices[Constants.PREPASS_COLOR_TEXTURE_TYPE] = 0;
        this._mrtLayout = [Constants.PREPASS_COLOR_TEXTURE_TYPE];
        this._mrtFormats = [Constants.TEXTURETYPE_HALF_FLOAT];
        this.mrtCount = 1;
    }

    private _resetPostProcessChain() {
        this._postProcesses = [];
        if (this.imageProcessingPostProcess) {
            this.imageProcessingPostProcess.restoreDefaultInputTexture();
        }

        for (let i = 0; i < this._effectConfigurations.length; i++) {
            if (this._effectConfigurations[i].postProcess) {
                this._effectConfigurations[i].postProcess!.restoreDefaultInputTexture();
            }
        }
    }

    private _bindPostProcessChain() {
        if (this._postProcesses.length) {
            this._postProcesses[0].inputTexture = this.prePassRT.getInternalTexture()!;
        } else {
            const pp = this._scene.activeCamera?._getFirstPostProcess();
            if (pp) {
                pp.inputTexture = this.prePassRT.getInternalTexture()!;
            }
        }
    }

    /**
     * Marks the prepass renderer as dirty, triggering a check if the prepass is necessary for the next rendering.
     */
    public markAsDirty() {
        this._isDirty = true;
    }

    /**
     * Enables a texture on the MultiRenderTarget for prepass
     */
    private _enableTextures(types: number[]) {
        for (let i = 0; i < types.length; i++) {
            let type = types[i];

            if (this._textureIndices[type] === -1) {
                this._textureIndices[type] = this._mrtLayout.length;
                this._mrtLayout.push(type);

                this._mrtFormats.push(this._textureFormats[type].format);
                this.mrtCount++;
            }
        }
    }

    private _update() {
        this._disable();
        let enablePrePass = false;

        for (let i = 0; i < this._scene.materials.length; i++) {
            if (this._scene.materials[i].setPrePassRenderer(this)) {
                enablePrePass = true;
            }
        }

        const camera = this._scene.activeCamera;
        if (!camera) {
            return;
        }

        const postProcesses = (<Nullable<PostProcess[]>>camera._postProcesses.filter((pp) => { return pp != null; }));

        if (postProcesses) {
            for (let i = 0; i < postProcesses.length; i++) {
                if (postProcesses[i].setPrePassRenderer(this)) {
                    enablePrePass = true;
                }
            }
        }

        this._markAllMaterialsAsPrePassDirty();
        this._isDirty = false;

        if (enablePrePass) {
            this._enable();
        }

        if (!this.enabled) {
            // Prepass disabled, we render only on 1 color attachment
            this._engine.restoreDefaultFramebuffer();
            this._engine.restoreSingleAttachment();
        }
    }

    private _markAllMaterialsAsPrePassDirty() {
        const materials = this._scene.materials;

        for (let i = 0; i < materials.length; i++) {
            materials[i].markAsDirty(Material.PrePassDirtyFlag);
        }
    }

    /**
     * Disposes the prepass renderer.
     */
    public dispose() {
        for (let i = 0; i < this._effectConfigurations.length; i++) {
            if (this._effectConfigurations[i].dispose) {
                this._effectConfigurations[i].dispose!();
            }
        }

        this.imageProcessingPostProcess.dispose();
        this.prePassRT.dispose();
    }

}
