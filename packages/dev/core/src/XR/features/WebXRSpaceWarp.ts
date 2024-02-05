import type { Engine } from "../../Engines/engine";
import type { WebGLRenderTargetWrapper } from "../../Engines/WebGL/webGLRenderTargetWrapper";
import { WebXRFeatureName, WebXRFeaturesManager } from "../webXRFeaturesManager";
import type { WebXRSessionManager } from "../webXRSessionManager";
import { WebXRAbstractFeature } from "./WebXRAbstractFeature";
import type { Nullable } from "../../types";
import type { IWebXRRenderTargetTextureProvider } from "../webXRRenderTargetTextureProvider";
import type { Viewport } from "../../Maths/math.viewport";
import type { Scene } from "../../scene";
import { Matrix } from "../../Maths/math.vector";
import { RenderTargetTexture } from "../../Materials/Textures/renderTargetTexture";
import { Constants } from "../../Engines/constants";
import { ShaderMaterial } from "../../Materials/shaderMaterial";
import type { AbstractMesh } from "../../Meshes/abstractMesh";
import type { Material } from "../../Materials/material";

import "../../Shaders/velocity.fragment";
import "../../Shaders/velocity.vertex";
import type { Observer } from "core/Misc/observable";

/**
 * Used for Space Warp render process
 */
export class XRSpaceWarpRenderTarget extends RenderTargetTexture {
    private _velocityMaterial: ShaderMaterial;
    private _originalPairing: Array<[AbstractMesh, Nullable<Material>]> = [];
    private _previousWorldMatrices: Array<Matrix> = [];
    private _previousTransforms: Matrix[] = [Matrix.Identity(), Matrix.Identity()];

    /**
     * Creates a Space Warp render target
     * @param motionVectorTexture WebGLTexture provided by WebGLSubImage
     * @param depthStencilTexture WebGLTexture provided by WebGLSubImage
     * @param scene scene used with the render target
     * @param size the size of the render target (used for each view)
     */
    constructor(motionVectorTexture: WebGLTexture, depthStencilTexture: WebGLTexture, scene?: Scene, size: number | { width: number; height: number } | { ratio: number } = 512) {
        super("spacewarp rtt", size, scene, false, true, Constants.TEXTURETYPE_HALF_FLOAT, false, undefined, false, false, true, undefined, true);
        this._renderTarget = this.getScene()!
            .getEngine()
            .createMultiviewRenderTargetTexture(this.getRenderWidth(), this.getRenderHeight(), motionVectorTexture, depthStencilTexture);
        (this._renderTarget as WebGLRenderTargetWrapper)._disposeOnlyFramebuffers = true;
        this._texture = this._renderTarget.texture!;
        this._texture.isMultiview = true;
        this._texture.format = Constants.TEXTUREFORMAT_RGBA;

        if (scene) {
            this._velocityMaterial = new ShaderMaterial(
                "velocity shader material",
                scene,
                {
                    vertex: "velocity",
                    fragment: "velocity",
                },
                {
                    uniforms: ["world", "previousWorld", "viewProjection", "viewProjectionR", "previousViewProjection", "previousViewProjectionR"],
                }
            );
            this._velocityMaterial._materialHelperNeedsPreviousMatrices = true;
            this._velocityMaterial.onBindObservable.add((mesh) => {
                // mesh. getWorldMatrix can be incorrect under rare conditions (e.g. when using a effective mesh in the render function).
                // If the case arise that will require changing it we will need to change the bind process in the material class to also provide the world matrix as a parameter
                this._previousWorldMatrices[mesh.uniqueId] = this._previousWorldMatrices[mesh.uniqueId] || mesh.getWorldMatrix();
                this._velocityMaterial.getEffect().setMatrix("previousWorld", this._previousWorldMatrices[mesh.uniqueId]);
                this._previousWorldMatrices[mesh.uniqueId] = mesh.getWorldMatrix();
                // now set the scene's previous matrix
                this._velocityMaterial.getEffect().setMatrix("previousViewProjection", this._previousTransforms[0]);
                // multiview for sure
                this._velocityMaterial.getEffect().setMatrix("previousViewProjectionR", this._previousTransforms[1]);

                // store the previous (current, to be exact) transforms
                this._previousTransforms[0].copyFrom(scene.getTransformMatrix());
                this._previousTransforms[1].copyFrom(scene._transformMatrixR);
            });
            this._velocityMaterial.freeze();
        }
    }

    public render(useCameraPostProcess: boolean = false, dumpForDebug: boolean = false): void {
        // Swap to use velocity material
        this._originalPairing.length = 0;
        const scene = this.getScene();
        // set the velocity material to render the velocity RTT
        if (scene && this._velocityMaterial) {
            scene.getActiveMeshes().forEach((mesh) => {
                this._originalPairing.push([mesh, mesh.material]);
                mesh.material = this._velocityMaterial;
            });
        }

        super.render(useCameraPostProcess, dumpForDebug);

        // Restore original materials
        this._originalPairing.forEach((tuple) => {
            tuple[0].material = tuple[1];
        });
    }

    /**
     * @internal
     */
    public _bindFrameBuffer() {
        if (!this._renderTarget) {
            return;
        }
        this.getScene()!.getEngine().bindSpaceWarpFramebuffer(this._renderTarget);
    }

    /**
     * Gets the number of views the corresponding to the texture (eg. a SpaceWarpRenderTarget will have > 1)
     * @returns the view count
     */
    public getViewCount() {
        return 2;
    }

    public dispose(): void {
        super.dispose();
        this._velocityMaterial.dispose();
        this._previousTransforms.length = 0;
        this._previousWorldMatrices.length = 0;
        this._originalPairing.length = 0;
    }
}

/**
 * WebXR Space Warp Render Target Texture Provider
 */
export class WebXRSpaceWarpRenderTargetTextureProvider implements IWebXRRenderTargetTextureProvider {
    protected _lastSubImages = new Map<XRView, XRWebGLSubImage>();
    protected _renderTargetTextures = new Map<XREye, RenderTargetTexture>();
    protected _framebufferDimensions: Nullable<{ framebufferWidth: number; framebufferHeight: number }>;
    protected _engine: Engine;

    constructor(
        protected readonly _scene: Scene,
        protected readonly _xrSessionManager: WebXRSessionManager,
        protected readonly _xrWebGLBinding: XRWebGLBinding
    ) {
        this._engine = _scene.getEngine();
    }

    private _getSubImageForView(view: XRView): XRWebGLSubImage {
        const layerWrapper = this._xrSessionManager._getBaseLayerWrapper();
        if (!layerWrapper) {
            throw new Error("For Space Warp, the base layer should be a WebXR Projection Layer.");
        }
        if (layerWrapper.layerType !== "XRProjectionLayer") {
            throw new Error('For Space Warp, the base layer type should "XRProjectionLayer".');
        }
        const layer = layerWrapper.layer as XRProjectionLayer;
        return this._xrWebGLBinding.getViewSubImage(layer, view);
    }

    protected _setViewportForSubImage(viewport: Viewport, subImage: XRWebGLSubImage) {
        viewport.x = 0;
        viewport.y = 0;
        viewport.width = subImage.motionVectorTextureWidth!;
        viewport.height = subImage.motionVectorTextureHeight!;
    }

    protected _createRenderTargetTexture(
        width: number,
        height: number,
        framebuffer: Nullable<WebGLFramebuffer>,
        motionVectorTexture: WebGLTexture,
        depthStencilTexture: WebGLTexture
    ): RenderTargetTexture {
        if (!this._engine) {
            throw new Error("Engine is disposed");
        }

        const textureSize = { width, height };

        // Create render target texture from the internal texture
        const renderTargetTexture = new XRSpaceWarpRenderTarget(motionVectorTexture, depthStencilTexture, this._scene, textureSize);
        const renderTargetWrapper = renderTargetTexture.renderTarget as WebGLRenderTargetWrapper;
        if (framebuffer) {
            renderTargetWrapper._framebuffer = framebuffer;
        }

        // Create internal texture
        renderTargetWrapper._colorTextureArray = motionVectorTexture;
        renderTargetWrapper._depthStencilTextureArray = depthStencilTexture;

        renderTargetTexture.disableRescaling();
        renderTargetTexture.renderListPredicate = () => true;

        return renderTargetTexture;
    }

    protected _getRenderTargetForSubImage(subImage: XRWebGLSubImage, view: XRView) {
        const lastSubImage = this._lastSubImages.get(view);
        let renderTargetTexture = this._renderTargetTextures.get(view.eye);

        const width = subImage.motionVectorTextureWidth!;
        const height = subImage.motionVectorTextureHeight!;

        if (!renderTargetTexture || lastSubImage?.textureWidth !== width || lastSubImage?.textureHeight != height) {
            renderTargetTexture = this._createRenderTargetTexture(width, height, null, subImage.motionVectorTexture!, subImage.depthStencilTexture!);
            this._renderTargetTextures.set(view.eye, renderTargetTexture);

            this._framebufferDimensions = {
                framebufferWidth: width,
                framebufferHeight: height,
            };
        }

        this._lastSubImages.set(view, subImage);

        return renderTargetTexture;
    }

    public trySetViewportForView(viewport: Viewport, view: XRView): boolean {
        const subImage = this._lastSubImages.get(view) || this._getSubImageForView(view);
        if (subImage) {
            this._setViewportForSubImage(viewport, subImage);
            return true;
        }
        return false;
    }

    /**
     * Access the motion vector (which will turn on Space Warp)
     * @param view the view to access the motion vector texture for
     */
    public accessMotionVector(view: XRView): void {
        const subImage = this._getSubImageForView(view);
        if (subImage) {
            // Meta Quest Browser uses accessing these textures as a sign for turning on Space Warp
            subImage.motionVectorTexture;
            subImage.depthStencilTexture;
        }
    }

    public getRenderTargetTextureForEye(_eye: XREye): Nullable<RenderTargetTexture> {
        return null;
    }

    public getRenderTargetTextureForView(view: XRView): Nullable<RenderTargetTexture> {
        const subImage = this._getSubImageForView(view);
        if (subImage) {
            return this._getRenderTargetForSubImage(subImage, view);
        }
        return null;
    }

    public dispose() {
        this._renderTargetTextures.forEach((rtt) => rtt.dispose());
        this._renderTargetTextures.clear();
    }
}

/**
 * the WebXR Space Warp feature.
 */
export class WebXRSpaceWarp extends WebXRAbstractFeature {
    /**
     * The module's name
     */
    public static readonly Name = WebXRFeatureName.SPACE_WARP;
    /**
     * The (Babylon) version of this module.
     * This is an integer representing the implementation version.
     * This number does not correspond to the WebXR specs version
     */
    public static readonly Version = 1;

    /**
     * The space warp provider
     */
    public spaceWarpRTTProvider: Nullable<WebXRSpaceWarpRenderTargetTextureProvider>;
    private _glContext: WebGLRenderingContext | WebGL2RenderingContext;
    private _xrWebGLBinding: XRWebGLBinding;
    private _renderTargetTexture: Nullable<RenderTargetTexture>;
    private _onAfterRenderObserver: Nullable<Observer<Scene>> = null;

    /**
     * constructor for the space warp feature
     * @param _xrSessionManager the xr session manager for this feature
     */
    constructor(_xrSessionManager: WebXRSessionManager) {
        super(_xrSessionManager);
        this.xrNativeFeatureName = "space-warp";
        this._xrSessionManager.scene.needsPreviousWorldMatrices = true;
    }

    /**
     * Attach this feature.
     * Will usually be called by the features manager.
     *
     * @returns true if successful.
     */
    public attach(): boolean {
        if (!super.attach()) {
            return false;
        }

        const engine = this._xrSessionManager.scene.getEngine();
        this._glContext = engine._gl;
        this._xrWebGLBinding = new XRWebGLBinding(this._xrSessionManager.session, this._glContext);

        this.spaceWarpRTTProvider = new WebXRSpaceWarpRenderTargetTextureProvider(this._xrSessionManager.scene, this._xrSessionManager, this._xrWebGLBinding);

        this._onAfterRenderObserver = this._xrSessionManager.scene.onAfterRenderObservable.add(() => this._onAfterRender());

        return true;
    }

    public detach(): boolean {
        this._xrSessionManager.scene.onAfterRenderObservable.remove(this._onAfterRenderObserver);
        return super.detach();
    }

    private _onAfterRender(): void {
        if (this.attached && this._renderTargetTexture) {
            this._renderTargetTexture.render(false, false);
        }
    }

    public dependsOn: string[] = [WebXRFeatureName.LAYERS];

    public isCompatible(): boolean {
        return this._xrSessionManager.scene.getEngine().getCaps().colorBufferHalfFloat || false;
    }

    public dispose(): void {
        super.dispose();
    }

    protected _onXRFrame(_xrFrame: XRFrame): void {
        const pose = _xrFrame.getViewerPose(this._xrSessionManager.referenceSpace);
        if (!pose) {
            return;
        }

        // get the first view to which we will create a texture (or update it)
        const view = pose.views[0];
        this._renderTargetTexture = this._renderTargetTexture || this.spaceWarpRTTProvider!.getRenderTargetTextureForView(view);
        this.spaceWarpRTTProvider!.accessMotionVector(view);
    }
}

//register the plugin
WebXRFeaturesManager.AddWebXRFeature(
    WebXRSpaceWarp.Name,
    (xrSessionManager) => {
        return () => new WebXRSpaceWarp(xrSessionManager);
    },
    WebXRSpaceWarp.Version,
    false
);
