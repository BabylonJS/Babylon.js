import { PrePassRenderTarget } from "../Materials/Textures/prePassRenderTarget";
import { Scene } from "../scene";
import { Engine } from "../Engines/engine";
import { Constants } from "../Engines/constants";
import { PostProcess } from "../PostProcesses/postProcess";
import { Effect } from "../Materials/effect";
import { _DevTools } from '../Misc/devTools';
import { Color4 } from "../Maths/math.color";
import { PrePassEffectConfiguration } from "./prePassEffectConfiguration";
import { Nullable } from "../types";
import { AbstractMesh } from '../Meshes/abstractMesh';
import { Camera } from '../Cameras/camera';
import { Material } from '../Materials/material';
import { SubMesh } from '../Meshes/subMesh';

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
    private _isDirty: boolean = false;

    /**
     * The render target where the scene is directly rendered
     */
    public defaultRT: PrePassRenderTarget;

    /**
     * Returns the prepass render target for the rendering pass. 
     * If we are currently rendering a render target, it returns the PrePassRenderTarget 
     * associated with that render target. Otherwise, it returns the scene default PrePassRenderTarget
     */
    public getRenderTarget(): PrePassRenderTarget {
        return this._currentTarget;
    }

    public _setRenderTarget(prePassRenderTarget: Nullable<PrePassRenderTarget>): void {
        if (prePassRenderTarget) {
            this._currentTarget = prePassRenderTarget;
        } else {
            this._currentTarget = this.defaultRT;
        }
    }

    private _currentTarget: PrePassRenderTarget;
    private _renderTargets: PrePassRenderTarget[] = [];

    private readonly _clearColor = new Color4(0, 0, 0, 0);

    /**
     * Configuration for prepass effects
     */
    private _effectConfigurations: PrePassEffectConfiguration[] = [];

    private _enabled: boolean = false;

    private _needsCompositionForThisCamera = false;

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
     * Instanciates a prepass renderer
     * @param scene The scene
     */
    constructor(scene: Scene) {
        this._scene = scene;
        this._engine = scene.getEngine();

        PrePassRenderer._SceneComponentInitialization(this._scene);
        this.defaultRT = this._createRenderTarget();
    }

    private _createRenderTarget() : PrePassRenderTarget {
        const rt = new PrePassRenderTarget("sceneprePassRT", this, { width: this._engine.getRenderWidth(), height: this._engine.getRenderHeight() }, 0, this._scene,
            { generateMipMaps: false, generateDepthTexture: true, defaultType: Constants.TEXTURETYPE_UNSIGNED_INT, types: [] });
        rt.samples = 1;

        this._renderTargets.push(rt);
        return rt;
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
                this._engine.bindAttachments(this._currentTarget._multiRenderAttachments);
            } else {
                this._engine.bindAttachments(this._currentTarget._defaultAttachments);

                // TODO : geometry buffer renderer
                // if (this._geometryBuffer) {
                //     const material = subMesh.getMaterial();
                //     if (material && this.excludedMaterials.indexOf(material) === -1) {
                //         this._geometryBuffer.renderList!.push(subMesh.getRenderingMesh());
                //     }
                // }
            }
        }
    }

    /**
     * Restores attachments for single texture draw.
     */
    public restoreAttachments() {
        if (this.enabled && this._currentTarget._defaultAttachments) {
            this._engine.bindAttachments(this._currentTarget._defaultAttachments);
        }
    }

    /**
     * @hidden
     */
    public _beforeCameraDraw(camera: Camera) {
        if (this._isDirty) {
            this._update(this._currentTarget);
        }

        if (!this._enabled) {
            return;
        }

        // TODO : handle geometry buffer renderer fallback
        if (this._currentTarget._geometryBuffer) {
            this._currentTarget._geometryBuffer.renderList!.length = 0;
        }

        this._setupOutputForCamera(this._currentTarget, camera);
    }

    /**
     * @hidden
     */
    public _afterCameraDraw(camera: Camera) {
        if (this._enabled) {
            this._scene.postProcessManager._prepareFrame();
            const firstCameraPP = camera && camera._getFirstPostProcess();
            let outputTexture = firstCameraPP ? firstCameraPP.inputTexture : null

            // Build post process chain for this prepass post draw
            let postProcessChain = this._currentTarget._beforeCompositionPostProcesses;

            // For now we do not support effect configuration post processes in render targets
            if (this._currentTarget !== this.defaultRT) {
                postProcessChain = [];
            }
            
            if (this._needsCompositionForThisCamera) {
                postProcessChain = postProcessChain.concat([this._currentTarget.imageProcessingPostProcess]);
            }

            // Activates the chain
            if (postProcessChain.length) {
                this._scene.postProcessManager._prepareFrame(this._currentTarget.getInternalTexture()!, postProcessChain);
            }

            // Renders the post process chain 
            this._scene.postProcessManager.directRender(postProcessChain, outputTexture);

            if (!outputTexture) {
                this._engine.restoreDefaultFramebuffer();
            }
        }
    }

    /**
     * Clears the render target (in the sense of settings pixels to the scene clear color value)
     */
    public _clear() {
        if (this._enabled) {
            this._bindFrameBuffer(this._currentTarget);

            // Clearing other attachment with 0 on all other attachments
            this._engine.bindAttachments(this._currentTarget._clearAttachments);
            this._engine.clear(this._clearColor, true, false, false);

            // Regular clear color with the scene clear color of the 1st attachment
            this._engine.bindAttachments(this._currentTarget._defaultAttachments);
            this._engine.clear(this._scene.clearColor,
                this._scene.autoClear || this._scene.forceWireframe || this._scene.forcePointsCloud,
                this._scene.autoClearDepthAndStencil,
                this._scene.autoClearDepthAndStencil);
        }
    }

    private _bindFrameBuffer(prePassRenderTarget: PrePassRenderTarget) {
        if (this._enabled) {
            this._currentTarget._checkSize();
            var internalTexture = this._currentTarget.getInternalTexture();
            if (internalTexture) {
                this._engine.bindFramebuffer(internalTexture);
            }
        }
    }

    private _setState(prePassRenderTarget: PrePassRenderTarget, enabled: boolean) {
        this._enabled = enabled;

        // TODO : generalize flag to signalize we are rendering to prepass for this frame
        this._scene.prePass = enabled;

        if (prePassRenderTarget.imageProcessingPostProcess) {
            prePassRenderTarget.imageProcessingPostProcess.imageProcessingConfiguration.applyByPostProcess = enabled;
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

    private _enable(prePassRenderTarget: PrePassRenderTarget) {
        // TODO : loop over all rts, this function shouldn't be called with prePassRenderTarget
        const previousMrtCount = prePassRenderTarget.mrtCount;

        for (let i = 0; i < this._effectConfigurations.length; i++) {
            if (this._effectConfigurations[i].enabled) {
                this._enableTextures(prePassRenderTarget, this._effectConfigurations[i].texturesRequired);
            }
        }

        if (prePassRenderTarget.mrtCount !== previousMrtCount) {
            prePassRenderTarget.updateCount(prePassRenderTarget.mrtCount, { types: prePassRenderTarget._mrtFormats });
        }

        prePassRenderTarget._updateGeometryBufferLayout();
        prePassRenderTarget._resetPostProcessChain();

        for (let i = 0; i < this._effectConfigurations.length; i++) {
            if (this._effectConfigurations[i].enabled) {
                // TODO : 1 post process per prepass RT to avoid recreating textures if size are differing
                if (!this._effectConfigurations[i].postProcess && this._effectConfigurations[i].createPostProcess) {
                    this._effectConfigurations[i].createPostProcess!();
                }

                if (this._effectConfigurations[i].postProcess) {
                    prePassRenderTarget._beforeCompositionPostProcesses.push(this._effectConfigurations[i].postProcess!);
                }
            }
        }

        prePassRenderTarget._reinitializeAttachments();

        if (!prePassRenderTarget.imageProcessingPostProcess) {
            prePassRenderTarget._createCompositionEffect();
        }

        this._setState(prePassRenderTarget, true);
    }

    private _disable(prePassRenderTarget: PrePassRenderTarget) {
        this._setState(prePassRenderTarget, false);

        // TODO : separate and loop over all rt, this function shouldn't need to be called with prePassRenderTarget
        prePassRenderTarget._resetLayout();

        for (let i = 0; i < this._effectConfigurations.length; i++) {
            this._effectConfigurations[i].enabled = false;
        }
    }

    // private _bindPostProcessChain() {
    //     if (this._postProcesses.length) {
    //         this._postProcesses[0].inputTexture = this.defaultRT.getInternalTexture()!;
    //     } else {
    //         const pp = this._scene.activeCamera?._getFirstPostProcess();
    //         if (pp) {
    //             pp.inputTexture = this.defaultRT.getInternalTexture()!;
    //         }
    //     }
    // }

    private _setupOutputForCamera(prePassRenderTarget: PrePassRenderTarget, camera: Camera) {
        // Here we search for an image composition post process
        // If no ipp if found, we use the prepass built-in
        // We also set the framebuffer to the input texture of the first post process that is to come
        const secondaryCamera = this._scene.activeCameras && this._scene.activeCameras.length && this._scene.activeCameras.indexOf(camera) !== 0;
        this._needsCompositionForThisCamera = !this._cameraHasImageProcessing(camera) && !this.disableGammaTransform && !secondaryCamera;
        const firstCameraPP = camera && camera._getFirstPostProcess();
        const firstPrePassPP = prePassRenderTarget._beforeCompositionPostProcesses && prePassRenderTarget._beforeCompositionPostProcesses[0];
        let firstPP = null;

        prePassRenderTarget.imageProcessingPostProcess.restoreDefaultInputTexture();

        // Setting the defaultRT as input texture of the first PP
        if (firstPrePassPP) {
            firstPrePassPP.inputTexture = this.defaultRT.getInternalTexture()!;
            firstPP = firstPrePassPP;
        } else if (this._needsCompositionForThisCamera) {
            prePassRenderTarget.imageProcessingPostProcess.inputTexture = this.defaultRT.getInternalTexture()!;
            firstPP = prePassRenderTarget.imageProcessingPostProcess;
        } else if (firstCameraPP) {
            firstCameraPP.inputTexture = this.defaultRT.getInternalTexture()!;
            firstPP = firstCameraPP;
        }
        
        if (firstPP) {
            firstPP.autoClear = false;
        }

        this._bindFrameBuffer(prePassRenderTarget);
    }

    private _cameraHasImageProcessing(camera: Camera): boolean {
        let isIPPAlreadyPresent = false;
        if (camera._postProcesses) {
            for (let i = 0; i < camera._postProcesses.length; i++) {
                if (camera._postProcesses[i]?.getClassName() === "ImageProcessingPostProcess") {
                    isIPPAlreadyPresent = true;
                }
            }
        }

        return isIPPAlreadyPresent;
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
    private _enableTextures(prePassRenderTarget: PrePassRenderTarget, types: number[]) {
        for (let i = 0; i < types.length; i++) {
            let type = types[i];

            if (prePassRenderTarget._textureIndices[type] === -1) {
                prePassRenderTarget._textureIndices[type] = prePassRenderTarget._mrtLayout.length;
                prePassRenderTarget._mrtLayout.push(type);

                prePassRenderTarget._mrtFormats.push(PrePassRenderTarget._textureFormats[type].format);
                prePassRenderTarget.mrtCount++;
            }
        }
    }

    private _update(prePassRenderTarget: PrePassRenderTarget) {
        this._disable(prePassRenderTarget);
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
            this._enable(prePassRenderTarget);
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

        for (let i = 0; i < this._renderTargets.length; i++) {
            this._renderTargets[i].dispose();
        }
    }

}
