import type { Engine } from "../../Engines/engine";
import type { WebGLRenderTargetWrapper } from "../../Engines/WebGL/webGLRenderTargetWrapper";
import { WebXRFeatureName, WebXRFeaturesManager } from "../webXRFeaturesManager";
import type { WebXRSessionManager } from "../webXRSessionManager";
import { WebXRAbstractFeature } from "./WebXRAbstractFeature";
import type { Nullable } from "../../types";
import type { IWebXRRenderTargetTextureProvider } from "../webXRRenderTargetTextureProvider";
import type { RenderTargetTexture } from "../../Materials/Textures/renderTargetTexture";
import type { Viewport } from "../../Maths/math.viewport";
import type { Scene } from "../../scene";
import { SpaceWarpRenderTarget } from "../../Materials/Textures/spaceWarpRenderTarget";

export class WebXRSpaceWarpRenderTargetTextureProvider implements IWebXRRenderTargetTextureProvider {
    protected _lastSubImages = new Map<XRView, XRWebGLSubImage>();
    protected _renderTargetTextures = new Map<XREye, RenderTargetTexture>();
    protected _framebufferDimensions: Nullable<{ framebufferWidth: number; framebufferHeight: number }>;
    protected _engine: Engine;

    constructor(
        protected readonly _scene: Scene,
        protected readonly _xrSessionManager: WebXRSessionManager,
        protected readonly _xrWebGLBinding: XRWebGLBinding,
    ) {
        this._engine = _scene.getEngine();
    }

    private _getSubImageForView(view: XRView): XRWebGLSubImage {
        const layerWrapper = this._xrSessionManager._getBaseLayerWrapper();
        if (!layerWrapper) {
            throw new Error("For Space Warp, the base layer should be a WebXR Projection Layer.");
        }
        if (layerWrapper.layerType !== "XRProjectionLayer") {
            throw new Error("For Space Warp, the base layer type should \"XRProjectionLayer\".");
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
        depthStencilTexture: WebGLTexture,
    ): RenderTargetTexture {
        if (!this._engine) {
            throw new Error("Engine is disposed");
        }

        const textureSize = { width, height };

        // Create render target texture from the internal texture
        const renderTargetTexture = new SpaceWarpRenderTarget(motionVectorTexture, depthStencilTexture, this._scene, textureSize);
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
            renderTargetTexture = this._createRenderTargetTexture(
                width,
                height,
                null,
                subImage.motionVectorTexture!,
                subImage.depthStencilTexture!,
            );
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
 * Exposes the WebXR Space Warp API.
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

    public spaceWarpRTTProvider: Nullable<WebXRSpaceWarpRenderTargetTextureProvider>;
    private _glContext: WebGLRenderingContext | WebGL2RenderingContext;
    private _xrWebGLBinding: XRWebGLBinding;
    private _renderTargetTexture: Nullable<RenderTargetTexture>;

    constructor(_xrSessionManager: WebXRSessionManager) {
        super(_xrSessionManager);
        this.xrNativeFeatureName = "space-warp";
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

        this._xrSessionManager.scene.onAfterRenderObservable.add(this._onAfterRender.bind(this));

        // TODO: Would there be a one frame delay if not set earlier?
        // TODO: How can I set this earlier and not just when entering immersive?
        this._xrSessionManager.scene.needsPreviousWorldMatrices = true;

        return true;
    }

    private _onAfterRender(): void {
        if (this.attached && this._renderTargetTexture) {
            this._renderTargetTexture.render(false, false);
        }

        this._xrSessionManager.scene._savePreviousTransformMatrix();
    }

    public dependsOn: string[] = [WebXRFeatureName.LAYERS];

    public isCompatible(): boolean {
        const engine = this._xrSessionManager.scene.getEngine();
        return !!engine.getCaps().colorBufferHalfFloat;
    }

    /**
     * Dispose this feature and all of the resources attached.
     */
    public dispose(): void {
        super.dispose();
    }

    protected _onXRFrame(_xrFrame: XRFrame): void {
        const pose = _xrFrame.getViewerPose(this._xrSessionManager.referenceSpace);
        if (!pose) {
            return;
        }

        pose.views.forEach((view: XRView, i: number) => {
            if (i == 0) {
                if (this._renderTargetTexture) {
                    this.spaceWarpRTTProvider!.accessMotionVector(view);
                } else {
                    this._renderTargetTexture = this.spaceWarpRTTProvider!.getRenderTargetTextureForView(view);
                }
            }
        });
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