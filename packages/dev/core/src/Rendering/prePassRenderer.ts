import { PrePassRenderTarget } from "../Materials/Textures/prePassRenderTarget";
import type { Scene } from "../scene";
import type { Engine } from "../Engines/engine";
import { Constants } from "../Engines/constants";
import type { PostProcess } from "../PostProcesses/postProcess";
import type { Effect } from "../Materials/effect";
import { _WarnImport } from "../Misc/devTools";
import { Color4 } from "../Maths/math.color";
import type { Nullable } from "../types";
import type { AbstractMesh } from "../Meshes/abstractMesh";
import type { Camera } from "../Cameras/camera";
import { Material } from "../Materials/material";
import type { SubMesh } from "../Meshes/subMesh";
import type { PrePassEffectConfiguration } from "./prePassEffectConfiguration";
import type { RenderTargetTexture } from "../Materials/Textures/renderTargetTexture";
import { GeometryBufferRenderer } from "../Rendering/geometryBufferRenderer";

/**
 * Renders a pre pass of the scene
 * This means every mesh in the scene will be rendered to a render target texture
 * And then this texture will be composited to the rendering canvas with post processes
 * It is necessary for effects like subsurface scattering or deferred shading
 */
export class PrePassRenderer {
    /**
     * @internal
     */
    public static _SceneComponentInitialization: (scene: Scene) => void = (_) => {
        throw _WarnImport("PrePassRendererSceneComponent");
    };

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

    private _scene: Scene;
    private _engine: Engine;

    /**
     * Number of textures in the multi render target texture where the scene is directly rendered
     */
    public mrtCount: number = 0;

    private _mrtTypes: number[] = [];
    private _mrtFormats: number[] = [];
    private _mrtLayout: number[] = [];
    private _mrtNames: string[] = [];
    private _textureIndices: number[] = [];

    private _multiRenderAttachments: number[];
    private _defaultAttachments: number[];
    private _clearAttachments: number[];
    private _clearDepthAttachments: number[];
    private _generateNormalsInWorldSpace = false;

    /**
     * Indicates if the prepass renderer is generating normals in world space or camera space (default: camera space)
     */
    public get generateNormalsInWorldSpace() {
        return this._generateNormalsInWorldSpace;
    }

    public set generateNormalsInWorldSpace(value: boolean) {
        if (this._generateNormalsInWorldSpace === value) {
            return;
        }

        this._generateNormalsInWorldSpace = value;
        this._markAllMaterialsAsPrePassDirty();
    }

    /**
     * Returns the index of a texture in the multi render target texture array.
     * @param type Texture type
     * @returns The index
     */
    public getIndex(type: number): number {
        return this._textureIndices[type];
    }

    /**
     * How many samples are used for MSAA of the scene render target
     */
    public get samples() {
        return this.defaultRT.samples;
    }

    public set samples(n: number) {
        this.defaultRT.samples = n;
    }

    private _useSpecificClearForDepthTexture = false;

    /**
     * If set to true (default: false), the depth texture will be cleared with the depth value corresponding to the far plane (1 in normal mode, 0 in reverse depth buffer mode)
     * If set to false, the depth texture is always cleared with 0.
     */
    public get useSpecificClearForDepthTexture() {
        return this._useSpecificClearForDepthTexture;
    }

    public set useSpecificClearForDepthTexture(value: boolean) {
        if (this._useSpecificClearForDepthTexture === value) {
            return;
        }

        this._useSpecificClearForDepthTexture = value;
        this._isDirty = true;
    }

    /**
     * Describes the types and formats of the textures used by the pre-pass renderer
     */
    public static TextureFormats = [
        {
            purpose: Constants.PREPASS_IRRADIANCE_TEXTURE_TYPE,
            type: Constants.TEXTURETYPE_HALF_FLOAT,
            format: Constants.TEXTUREFORMAT_RGBA,
            name: "prePass_Irradiance",
        },
        {
            purpose: Constants.PREPASS_POSITION_TEXTURE_TYPE,
            type: Constants.TEXTURETYPE_HALF_FLOAT,
            format: Constants.TEXTUREFORMAT_RGBA,
            name: "prePass_Position",
        },
        {
            purpose: Constants.PREPASS_VELOCITY_TEXTURE_TYPE,
            type: Constants.TEXTURETYPE_UNSIGNED_INT,
            format: Constants.TEXTUREFORMAT_RGBA,
            name: "prePass_Velocity",
        },
        {
            purpose: Constants.PREPASS_REFLECTIVITY_TEXTURE_TYPE,
            type: Constants.TEXTURETYPE_UNSIGNED_INT,
            format: Constants.TEXTUREFORMAT_RGBA,
            name: "prePass_Reflectivity",
        },
        {
            purpose: Constants.PREPASS_COLOR_TEXTURE_TYPE,
            type: Constants.TEXTURETYPE_HALF_FLOAT,
            format: Constants.TEXTUREFORMAT_RGBA,
            name: "prePass_Color",
        },
        {
            purpose: Constants.PREPASS_DEPTH_TEXTURE_TYPE,
            type: Constants.TEXTURETYPE_FLOAT,
            format: Constants.TEXTUREFORMAT_R,
            name: "prePass_Depth",
        },
        {
            purpose: Constants.PREPASS_NORMAL_TEXTURE_TYPE,
            type: Constants.TEXTURETYPE_HALF_FLOAT,
            format: Constants.TEXTUREFORMAT_RGBA,
            name: "prePass_Normal",
        },
        {
            purpose: Constants.PREPASS_ALBEDO_SQRT_TEXTURE_TYPE,
            type: Constants.TEXTURETYPE_UNSIGNED_INT,
            format: Constants.TEXTUREFORMAT_RGBA,
            name: "prePass_Albedo",
        },
    ];

    private _isDirty: boolean = true;

    /**
     * The render target where the scene is directly rendered
     */
    public defaultRT: PrePassRenderTarget;

    /**
     * Configuration for prepass effects
     */
    private _effectConfigurations: PrePassEffectConfiguration[] = [];

    /**
     * @returns the prepass render target for the rendering pass.
     * If we are currently rendering a render target, it returns the PrePassRenderTarget
     * associated with that render target. Otherwise, it returns the scene default PrePassRenderTarget
     */
    public getRenderTarget(): PrePassRenderTarget {
        return this._currentTarget;
    }

    /**
     * @internal
     * Managed by the scene component
     * @param prePassRenderTarget
     */
    public _setRenderTarget(prePassRenderTarget: Nullable<PrePassRenderTarget>): void {
        if (prePassRenderTarget) {
            this._currentTarget = prePassRenderTarget;
        } else {
            this._currentTarget = this.defaultRT;
            this._engine.currentRenderPassId = this._scene.activeCamera?.renderPassId ?? this._currentTarget.renderPassId;
        }
    }

    /**
     * Returns true if the currently rendered prePassRenderTarget is the one
     * associated with the scene.
     */
    public get currentRTisSceneRT(): boolean {
        return this._currentTarget === this.defaultRT;
    }

    private _geometryBuffer: Nullable<GeometryBufferRenderer>;

    /**
     * Prevents the PrePassRenderer from using the GeometryBufferRenderer as a fallback
     */
    public doNotUseGeometryRendererFallback = true;

    private _refreshGeometryBufferRendererLink() {
        if (!this.doNotUseGeometryRendererFallback) {
            this._geometryBuffer = this._scene.enableGeometryBufferRenderer();

            if (!this._geometryBuffer) {
                // Not supported
                this.doNotUseGeometryRendererFallback = true;
                return;
            }

            this._geometryBuffer._linkPrePassRenderer(this);
        } else {
            if (this._geometryBuffer) {
                this._geometryBuffer._unlinkPrePassRenderer();
            }
            this._geometryBuffer = null;
            this._scene.disableGeometryBufferRenderer();
        }
    }

    private _currentTarget: PrePassRenderTarget;

    /**
     * All the render targets generated by prepass
     */
    public renderTargets: PrePassRenderTarget[] = [];

    private readonly _clearColor = new Color4(0, 0, 0, 0);
    private readonly _clearDepthColor = new Color4(1e8, 0, 0, 1); // "infinity" value - depth in the depth texture is view.z, not a 0..1 value!

    private _enabled: boolean = false;

    private _needsCompositionForThisPass = false;
    private _postProcessesSourceForThisPass: Nullable<PostProcess>[];

    /**
     * Indicates if the prepass is enabled
     */
    public get enabled() {
        return this._enabled;
    }

    /**
     * Set to true to disable gamma transform in PrePass.
     * Can be useful in case you already proceed to gamma transform on a material level
     * and your post processes don't need to be in linear color space.
     */
    public disableGammaTransform = false;

    /**
     * Instantiates a prepass renderer
     * @param scene The scene
     */
    constructor(scene: Scene) {
        this._scene = scene;
        this._engine = scene.getEngine();

        let type = Constants.TEXTURETYPE_UNSIGNED_BYTE;
        if (this._engine._caps.textureFloat && this._engine._caps.textureFloatLinearFiltering) {
            type = Constants.TEXTURETYPE_FLOAT;
        } else if (this._engine._caps.textureHalfFloat && this._engine._caps.textureHalfFloatLinearFiltering) {
            type = Constants.TEXTURETYPE_HALF_FLOAT;
        }

        for (let i = 0; i < PrePassRenderer.TextureFormats.length; ++i) {
            const format = PrePassRenderer.TextureFormats[i].format;
            if (PrePassRenderer.TextureFormats[i].type === Constants.TEXTURETYPE_FLOAT) {
                PrePassRenderer.TextureFormats[Constants.PREPASS_DEPTH_TEXTURE_TYPE].type = type;
                if (
                    (format === Constants.TEXTUREFORMAT_R || format === Constants.TEXTUREFORMAT_RG || format === Constants.TEXTUREFORMAT_RGBA) &&
                    !this._engine._caps.supportFloatTexturesResolve
                ) {
                    // We don't know in advance if the texture will be used as a resolve target, so we revert to half_float if the extension to resolve full float textures is not supported
                    PrePassRenderer.TextureFormats[Constants.PREPASS_DEPTH_TEXTURE_TYPE].type = Constants.TEXTURETYPE_HALF_FLOAT;
                }
            }
        }

        PrePassRenderer._SceneComponentInitialization(this._scene);
        this.defaultRT = this._createRenderTarget("sceneprePassRT", null);
        this._currentTarget = this.defaultRT;
    }

    /**
     * Creates a new PrePassRenderTarget
     * This should be the only way to instantiate a `PrePassRenderTarget`
     * @param name Name of the `PrePassRenderTarget`
     * @param renderTargetTexture RenderTarget the `PrePassRenderTarget` will be attached to.
     * Can be `null` if the created `PrePassRenderTarget` is attached to the scene (default framebuffer).
     * @internal
     */
    public _createRenderTarget(name: string, renderTargetTexture: Nullable<RenderTargetTexture>): PrePassRenderTarget {
        const rt = new PrePassRenderTarget(name, renderTargetTexture, { width: this._engine.getRenderWidth(), height: this._engine.getRenderHeight() }, 0, this._scene, {
            generateMipMaps: false,
            generateStencilBuffer: this._engine.isStencilEnable,
            defaultType: Constants.TEXTURETYPE_UNSIGNED_INT,
            types: [],
            drawOnlyOnFirstAttachmentByDefault: true,
        });

        this.renderTargets.push(rt);

        if (this._enabled) {
            // The pre-pass renderer is already enabled, so make sure we create the render target with the correct number of textures
            this._update();
        }

        return rt;
    }

    /**
     * Indicates if rendering a prepass is supported
     */
    public get isSupported() {
        return this._scene.getEngine().getCaps().drawBuffersExtension;
    }

    /**
     * Sets the proper output textures to draw in the engine.
     * @param effect The effect that is drawn. It can be or not be compatible with drawing to several output textures.
     * @param subMesh Submesh on which the effect is applied
     */
    public bindAttachmentsForEffect(effect: Effect, subMesh: SubMesh) {
        const material = subMesh.getMaterial();
        const isPrePassCapable = material && material.isPrePassCapable;
        const excluded = material && this.excludedMaterials.indexOf(material) !== -1;

        if (this.enabled && this._currentTarget.enabled) {
            if (effect._multiTarget && isPrePassCapable && !excluded) {
                this._engine.bindAttachments(this._multiRenderAttachments);
            } else {
                if (this._engine._currentRenderTarget) {
                    this._engine.bindAttachments(this._defaultAttachments);
                } else {
                    this._engine.restoreSingleAttachment();
                }

                if (this._geometryBuffer && this.currentRTisSceneRT && !excluded) {
                    this._geometryBuffer.renderList!.push(subMesh.getRenderingMesh());
                }
            }
        }
    }

    private _reinitializeAttachments() {
        const multiRenderLayout = [];
        const clearLayout = [false];
        const clearDepthLayout = [false];
        const defaultLayout = [true];

        for (let i = 0; i < this.mrtCount; i++) {
            multiRenderLayout.push(true);

            if (i > 0) {
                if (this._useSpecificClearForDepthTexture && this._mrtLayout[i] === Constants.PREPASS_DEPTH_TEXTURE_TYPE) {
                    clearLayout.push(false);
                    clearDepthLayout.push(true);
                } else {
                    clearLayout.push(true);
                    clearDepthLayout.push(false);
                }
                defaultLayout.push(false);
            }
        }

        this._multiRenderAttachments = this._engine.buildTextureLayout(multiRenderLayout);
        this._clearAttachments = this._engine.buildTextureLayout(clearLayout);
        this._clearDepthAttachments = this._engine.buildTextureLayout(clearDepthLayout);
        this._defaultAttachments = this._engine.buildTextureLayout(defaultLayout);
    }

    private _resetLayout() {
        for (let i = 0; i < PrePassRenderer.TextureFormats.length; i++) {
            this._textureIndices[PrePassRenderer.TextureFormats[i].purpose] = -1;
        }

        this._textureIndices[Constants.PREPASS_COLOR_TEXTURE_TYPE] = 0;
        this._mrtLayout = [Constants.PREPASS_COLOR_TEXTURE_TYPE];
        this._mrtTypes = [PrePassRenderer.TextureFormats[Constants.PREPASS_COLOR_TEXTURE_TYPE].type];
        this._mrtFormats = [PrePassRenderer.TextureFormats[Constants.PREPASS_COLOR_TEXTURE_TYPE].format];
        this._mrtNames = [PrePassRenderer.TextureFormats[Constants.PREPASS_COLOR_TEXTURE_TYPE].name];
        this.mrtCount = 1;
    }

    private _updateGeometryBufferLayout() {
        this._refreshGeometryBufferRendererLink();

        if (this._geometryBuffer) {
            this._geometryBuffer._resetLayout();

            const texturesActivated = [];

            for (let i = 0; i < this._mrtLayout.length; i++) {
                texturesActivated.push(false);
            }

            this._geometryBuffer._linkInternalTexture(this.defaultRT.getInternalTexture()!);

            const matches = [
                {
                    prePassConstant: Constants.PREPASS_DEPTH_TEXTURE_TYPE,
                    geometryBufferConstant: GeometryBufferRenderer.DEPTH_TEXTURE_TYPE,
                },
                {
                    prePassConstant: Constants.PREPASS_NORMAL_TEXTURE_TYPE,
                    geometryBufferConstant: GeometryBufferRenderer.NORMAL_TEXTURE_TYPE,
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
                },
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
     * Restores attachments for single texture draw.
     */
    public restoreAttachments() {
        if (this.enabled && this._currentTarget.enabled && this._defaultAttachments) {
            if (this._engine._currentRenderTarget) {
                this._engine.bindAttachments(this._defaultAttachments);
            } else {
                this._engine.restoreSingleAttachment();
            }
        }
    }

    /**
     * @internal
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public _beforeDraw(camera?: Camera, faceIndex?: number, layer?: number) {
        // const previousEnabled = this._enabled && this._currentTarget.enabled;

        if (this._isDirty) {
            this._update();
        }

        if (!this._enabled || !this._currentTarget.enabled) {
            return;
        }

        if (this._geometryBuffer) {
            this._geometryBuffer.renderList = [];
        }

        this._setupOutputForThisPass(this._currentTarget, camera);
    }

    private _prepareFrame(prePassRenderTarget: PrePassRenderTarget, faceIndex?: number, layer?: number) {
        if (prePassRenderTarget.renderTargetTexture) {
            prePassRenderTarget.renderTargetTexture._prepareFrame(this._scene, faceIndex, layer, prePassRenderTarget.renderTargetTexture.useCameraPostProcesses);
        } else if (this._postProcessesSourceForThisPass.length) {
            this._scene.postProcessManager._prepareFrame();
        } else {
            this._engine.restoreDefaultFramebuffer();
        }
    }

    /**
     * Sets an intermediary texture between prepass and postprocesses. This texture
     * will be used as input for post processes
     * @param rt The render target texture to use
     * @returns true if there are postprocesses that will use this texture,
     * false if there is no postprocesses - and the function has no effect
     */
    public setCustomOutput(rt: RenderTargetTexture) {
        const firstPP = this._postProcessesSourceForThisPass[0];
        if (!firstPP) {
            return false;
        }

        firstPP.inputTexture = rt.renderTarget!;

        return true;
    }

    private _renderPostProcesses(prePassRenderTarget: PrePassRenderTarget, faceIndex?: number) {
        const firstPP = this._postProcessesSourceForThisPass[0];
        const outputTexture = firstPP ? firstPP.inputTexture : prePassRenderTarget.renderTargetTexture ? prePassRenderTarget.renderTargetTexture.renderTarget : null;

        // Build post process chain for this prepass post draw
        let postProcessChain = this._currentTarget._beforeCompositionPostProcesses;

        if (this._needsCompositionForThisPass) {
            postProcessChain = postProcessChain.concat([this._currentTarget.imageProcessingPostProcess]);
        }

        // Activates and renders the chain
        if (postProcessChain.length) {
            this._scene.postProcessManager._prepareFrame(this._currentTarget.renderTarget?.texture, postProcessChain);
            this._scene.postProcessManager.directRender(postProcessChain, outputTexture, false, faceIndex);
        }
    }

    /**
     * @internal
     */
    public _afterDraw(faceIndex?: number, layer?: number) {
        if (this._enabled && this._currentTarget.enabled) {
            this._prepareFrame(this._currentTarget, faceIndex, layer);
            this._renderPostProcesses(this._currentTarget, faceIndex);
        }
    }

    /**
     * Clears the current prepass render target (in the sense of settings pixels to the scene clear color value)
     * @internal
     */
    public _clear() {
        if (this._enabled && this._currentTarget.enabled) {
            this._bindFrameBuffer();

            // Clearing other attachment with 0 on all other attachments
            this._engine.bindAttachments(this._clearAttachments);
            this._engine.clear(this._clearColor, true, false, false);
            if (this._useSpecificClearForDepthTexture) {
                this._engine.bindAttachments(this._clearDepthAttachments);
                this._engine.clear(this._clearDepthColor, true, false, false);
            }
            // Regular clear color with the scene clear color of the 1st attachment
            this._engine.bindAttachments(this._defaultAttachments);
        }
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    private _bindFrameBuffer() {
        if (this._enabled && this._currentTarget.enabled) {
            this._currentTarget._checkSize();
            const internalTexture = this._currentTarget.renderTarget;
            if (internalTexture) {
                this._engine.bindFramebuffer(internalTexture);
            }
        }
    }

    private _setEnabled(enabled: boolean) {
        this._enabled = enabled;
    }

    private _setRenderTargetEnabled(prePassRenderTarget: PrePassRenderTarget, enabled: boolean) {
        prePassRenderTarget.enabled = enabled;
        if (!enabled) {
            this._unlinkInternalTexture(prePassRenderTarget);
        }
    }

    /**
     * Adds an effect configuration to the prepass render target.
     * If an effect has already been added, it won't add it twice and will return the configuration
     * already present.
     * @param cfg the effect configuration
     * @returns the effect configuration now used by the prepass
     */
    public addEffectConfiguration(cfg: PrePassEffectConfiguration): PrePassEffectConfiguration {
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
     * Retrieves an effect configuration by name
     * @param name the name of the effect configuration
     * @returns the effect configuration, or null if not present
     */
    public getEffectConfiguration(name: string): Nullable<PrePassEffectConfiguration> {
        for (let i = 0; i < this._effectConfigurations.length; i++) {
            if (this._effectConfigurations[i].name === name) {
                return this._effectConfigurations[i];
            }
        }

        return null;
    }

    private _enable() {
        const previousMrtCount = this.mrtCount;

        for (let i = 0; i < this._effectConfigurations.length; i++) {
            if (this._effectConfigurations[i].enabled) {
                this._enableTextures(this._effectConfigurations[i].texturesRequired);
            }
        }

        for (let i = 0; i < this.renderTargets.length; i++) {
            if (this.mrtCount !== previousMrtCount || this.renderTargets[i].count !== this.mrtCount) {
                this.renderTargets[i].updateCount(this.mrtCount, { types: this._mrtTypes, formats: this._mrtFormats }, this._mrtNames.concat("prePass_DepthBuffer"));
            }

            this.renderTargets[i]._resetPostProcessChain();

            for (let j = 0; j < this._effectConfigurations.length; j++) {
                if (this._effectConfigurations[j].enabled) {
                    // TODO : subsurface scattering has 1 scene-wide effect configuration
                    // solution : do not stock postProcess on effectConfiguration, but in the prepassRenderTarget (hashmap configuration => postProcess)
                    // And call createPostProcess whenever the post process does not exist in the RT
                    if (!this._effectConfigurations[j].postProcess && this._effectConfigurations[j].createPostProcess) {
                        this._effectConfigurations[j].createPostProcess!();
                    }

                    if (this._effectConfigurations[j].postProcess) {
                        this.renderTargets[i]._beforeCompositionPostProcesses.push(this._effectConfigurations[j].postProcess!);
                    }
                }
            }
        }

        this._reinitializeAttachments();
        this._setEnabled(true);
        this._updateGeometryBufferLayout();
    }

    private _disable() {
        this._setEnabled(false);

        for (let i = 0; i < this.renderTargets.length; i++) {
            this._setRenderTargetEnabled(this.renderTargets[i], false);
        }

        this._resetLayout();

        for (let i = 0; i < this._effectConfigurations.length; i++) {
            this._effectConfigurations[i].enabled = false;
        }
    }

    private _getPostProcessesSource(prePassRenderTarget: PrePassRenderTarget, camera?: Camera): Nullable<PostProcess>[] {
        if (camera) {
            return camera._postProcesses;
        } else if (prePassRenderTarget.renderTargetTexture) {
            if (prePassRenderTarget.renderTargetTexture.useCameraPostProcesses) {
                const camera = prePassRenderTarget.renderTargetTexture.activeCamera ? prePassRenderTarget.renderTargetTexture.activeCamera : this._scene.activeCamera;
                return camera ? camera._postProcesses : [];
            } else if (prePassRenderTarget.renderTargetTexture.postProcesses) {
                return prePassRenderTarget.renderTargetTexture.postProcesses;
            } else {
                return [];
            }
        } else {
            return this._scene.activeCamera ? this._scene.activeCamera._postProcesses : [];
        }
    }

    private _setupOutputForThisPass(prePassRenderTarget: PrePassRenderTarget, camera?: Camera) {
        // Order is : draw ===> prePassRenderTarget._postProcesses ==> ipp ==> camera._postProcesses
        const secondaryCamera = camera && this._scene.activeCameras && !!this._scene.activeCameras.length && this._scene.activeCameras.indexOf(camera) !== 0;
        this._postProcessesSourceForThisPass = this._getPostProcessesSource(prePassRenderTarget, camera);
        this._postProcessesSourceForThisPass = this._postProcessesSourceForThisPass.filter((pp) => {
            return pp != null;
        });
        this._scene.autoClear = true;

        const cameraHasImageProcessing = this._hasImageProcessing(this._postProcessesSourceForThisPass);
        this._needsCompositionForThisPass = !cameraHasImageProcessing && !this.disableGammaTransform && this._needsImageProcessing() && !secondaryCamera;

        const firstCameraPP = this._getFirstPostProcess(this._postProcessesSourceForThisPass);
        const firstPrePassPP = prePassRenderTarget._beforeCompositionPostProcesses && prePassRenderTarget._beforeCompositionPostProcesses[0];
        let firstPP = null;

        // Setting the scene-wide post process configuration
        this._scene.imageProcessingConfiguration.applyByPostProcess = this._needsCompositionForThisPass || cameraHasImageProcessing;

        // Create composition effect if needed
        if (this._needsCompositionForThisPass && !prePassRenderTarget.imageProcessingPostProcess) {
            prePassRenderTarget._createCompositionEffect();
        }

        // Setting the prePassRenderTarget as input texture of the first PP
        if (firstPrePassPP) {
            firstPP = firstPrePassPP;
        } else if (this._needsCompositionForThisPass) {
            firstPP = prePassRenderTarget.imageProcessingPostProcess;
        } else if (firstCameraPP) {
            firstPP = firstCameraPP;
        }

        this._bindFrameBuffer();
        this._linkInternalTexture(prePassRenderTarget, firstPP);
    }

    private _linkInternalTexture(prePassRenderTarget: PrePassRenderTarget, postProcess: Nullable<PostProcess>) {
        if (postProcess) {
            postProcess.autoClear = false;
            postProcess.inputTexture = prePassRenderTarget.renderTarget!;
        }

        if (prePassRenderTarget._outputPostProcess !== postProcess) {
            if (prePassRenderTarget._outputPostProcess) {
                this._unlinkInternalTexture(prePassRenderTarget);
            }
            prePassRenderTarget._outputPostProcess = postProcess;
        }

        if (prePassRenderTarget._internalTextureDirty) {
            this._updateGeometryBufferLayout();
            prePassRenderTarget._internalTextureDirty = false;
        }
    }

    /**
     * @internal
     */
    public _unlinkInternalTexture(prePassRenderTarget: PrePassRenderTarget) {
        if (prePassRenderTarget._outputPostProcess) {
            prePassRenderTarget._outputPostProcess.autoClear = true;
            prePassRenderTarget._outputPostProcess.restoreDefaultInputTexture();
            prePassRenderTarget._outputPostProcess = null;
        }
    }

    private _needsImageProcessing(): boolean {
        for (let i = 0; i < this._effectConfigurations.length; i++) {
            if (this._effectConfigurations[i].enabled && this._effectConfigurations[i].needsImageProcessing) {
                return true;
            }
        }

        return false;
    }

    private _hasImageProcessing(postProcesses: Nullable<PostProcess>[]): boolean {
        let isIPPAlreadyPresent = false;
        if (postProcesses) {
            for (let i = 0; i < postProcesses.length; i++) {
                if (postProcesses[i]?.getClassName() === "ImageProcessingPostProcess") {
                    isIPPAlreadyPresent = true;
                    break;
                }
            }
        }

        return isIPPAlreadyPresent;
    }

    /**
     * Internal, gets the first post proces.
     * @param postProcesses
     * @returns the first post process to be run on this camera.
     */
    private _getFirstPostProcess(postProcesses: Nullable<PostProcess>[]): Nullable<PostProcess> {
        for (let ppIndex = 0; ppIndex < postProcesses.length; ppIndex++) {
            if (postProcesses[ppIndex] !== null) {
                return postProcesses[ppIndex];
            }
        }
        return null;
    }

    /**
     * Marks the prepass renderer as dirty, triggering a check if the prepass is necessary for the next rendering.
     */
    public markAsDirty() {
        this._isDirty = true;
    }

    /**
     * Enables a texture on the MultiRenderTarget for prepass
     * @param types
     */
    private _enableTextures(types: number[]) {
        // For velocity : enable storage of previous matrices for instances
        this._scene.needsPreviousWorldMatrices = false;

        for (let i = 0; i < types.length; i++) {
            const type = types[i];

            if (this._textureIndices[type] === -1) {
                this._textureIndices[type] = this._mrtLayout.length;
                this._mrtLayout.push(type);

                this._mrtTypes.push(PrePassRenderer.TextureFormats[type].type);
                this._mrtFormats.push(PrePassRenderer.TextureFormats[type].format);
                this._mrtNames.push(PrePassRenderer.TextureFormats[type].name);
                this.mrtCount++;
            }

            if (type === Constants.PREPASS_VELOCITY_TEXTURE_TYPE) {
                this._scene.needsPreviousWorldMatrices = true;
            }
        }
    }

    /**
     * Makes sure that the prepass renderer is up to date if it has been dirtified.
     */
    public update() {
        if (this._isDirty) {
            this._update();
        }
    }

    private _update() {
        this._disable();
        let enablePrePass = false;
        this._scene.imageProcessingConfiguration.applyByPostProcess = false;

        if (this._scene._depthPeelingRenderer && this._scene.useOrderIndependentTransparency) {
            this._scene._depthPeelingRenderer.setPrePassRenderer(this);
            enablePrePass = true;
        }

        for (let i = 0; i < this._scene.materials.length; i++) {
            if (this._scene.materials[i].setPrePassRenderer(this)) {
                enablePrePass = true;
            }
        }

        if (enablePrePass) {
            this._setRenderTargetEnabled(this.defaultRT, true);
        }

        let postProcesses;

        for (let i = 0; i < this.renderTargets.length; i++) {
            if (this.renderTargets[i].renderTargetTexture) {
                postProcesses = this._getPostProcessesSource(this.renderTargets[i]);
            } else {
                const camera = this._scene.activeCamera;
                if (!camera) {
                    continue;
                }

                postProcesses = camera._postProcesses;
            }

            if (!postProcesses) {
                continue;
            }

            postProcesses = <Nullable<PostProcess[]>>postProcesses.filter((pp) => {
                return pp != null;
            });

            if (postProcesses) {
                for (let j = 0; j < postProcesses.length; j++) {
                    if (postProcesses[j].setPrePassRenderer(this)) {
                        this._setRenderTargetEnabled(this.renderTargets[i], true);
                        enablePrePass = true;
                    }
                }

                if (this._hasImageProcessing(postProcesses)) {
                    this._scene.imageProcessingConfiguration.applyByPostProcess = true;
                }
            }
        }

        this._markAllMaterialsAsPrePassDirty();
        this._isDirty = false;

        if (enablePrePass) {
            this._enable();
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
        for (let i = this.renderTargets.length - 1; i >= 0; i--) {
            this.renderTargets[i].dispose();
        }

        for (let i = 0; i < this._effectConfigurations.length; i++) {
            if (this._effectConfigurations[i].dispose) {
                this._effectConfigurations[i].dispose!();
            }
        }
    }
}
