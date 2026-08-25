import { type InternalTexture } from "core/Materials/Textures/internalTexture";
import { type RenderTargetTexture } from "core/Materials/Textures/renderTargetTexture";
import { type Viewport } from "core/Maths/math.viewport";
import { Observable } from "core/Misc/observable";
import { type WebXRLayerType, WebXRLayerWrapper, type WebXRSpatialLayerType, type WebXRSupportedLayerType } from "core/XR/webXRLayerWrapper";
import { WebXRLayerRenderTargetTextureProvider } from "core/XR/webXRRenderTargetTextureProvider";
import { WebXRWebGLRenderTargetTextureProvider } from "core/XR/webXRWebGLRenderTargetTextureProvider";
import { type WebXRSessionManager } from "core/XR/webXRSessionManager";
import { type Nullable } from "core/types";
import { Quaternion, Vector3 } from "core/Maths/math.vector.pure";
import { type TransformNode } from "core/Meshes/transformNode.pure";

/**
 * The non-projection composition layers that can be positioned in an XR space.
 */
export type WebXRSpatialLayer = XRQuadLayer | XRCylinderLayer | XREquirectLayer | XRCubeLayer;

export type { WebXRSpatialLayerType } from "core/XR/webXRLayerWrapper";

/**
 * Wraps an XR composition layer and creates its Babylon render target provider.
 * @typeParam LayerT the concrete WebXR composition layer type
 */
export class WebXRCompositionLayerWrapper<
    LayerT extends XRCompositionLayer = XRCompositionLayer,
    LayerTypeT extends WebXRSupportedLayerType = WebXRLayerType,
> extends WebXRLayerWrapper<LayerTypeT> {
    /**
     * Whether this layer receives its content directly from an HTML media element.
     */
    public readonly isMediaLayer: boolean = false;

    /**
     * Whether Babylon should acquire subimages and expose render target textures for this layer.
     */
    public readonly usesRenderTargetProvider: boolean = true;

    constructor(
        public override getWidth: () => number,
        public override getHeight: () => number,
        public override readonly layer: LayerT,
        public override readonly layerType: LayerTypeT,
        /**
         * Whether the layer renders both views into a texture array.
         */
        public readonly isMultiview: boolean,
        public createRTTProvider: (xrSessionManager: WebXRSessionManager) => WebXRLayerRenderTargetTextureProvider<LayerTypeT>,
        public _originalInternalTexture: Nullable<InternalTexture> = null,
        private readonly _destroyLayerOnDispose = false,
        /**
         * Whether the layer can only be rendered when its native `needsRedraw` flag is set.
         */
        public readonly isStatic = false
    ) {
        super(getWidth, getHeight, layer, layerType, createRTTProvider);
    }

    /**
     * Disposes the Babylon render-target resources and destroys the native layer when this wrapper owns it.
     */
    public override dispose(): void {
        super.dispose();
        if (this._destroyLayerOnDispose) {
            this.layer.destroy();
        }
    }
}

/**
 * Wraps a positionable XR composition layer and synchronizes it with a Babylon transform node.
 * The node's scaling does not affect the physical dimensions of the layer.
 * @typeParam LayerT the concrete positionable WebXR layer type
 */
export class WebXRSpatialLayerWrapper<
    LayerT extends WebXRSpatialLayer = WebXRSpatialLayer,
    LayerTypeT extends WebXRSpatialLayerType = WebXRSpatialLayerType,
> extends WebXRCompositionLayerWrapper<LayerT, LayerTypeT> {
    private readonly _currentPosition = new Vector3();
    private readonly _currentRotation = new Quaternion();
    private readonly _lastPosition = new Vector3(Number.NaN, Number.NaN, Number.NaN);
    private readonly _lastRotation = new Quaternion(Number.NaN, Number.NaN, Number.NaN, Number.NaN);

    constructor(
        getWidth: () => number,
        getHeight: () => number,
        layer: LayerT,
        layerType: LayerTypeT,
        isMultiview: boolean,
        isStatic: boolean,
        /**
         * Whether the layer should follow changes to the session manager's reference space.
         */
        public readonly usesSessionReferenceSpace: boolean,
        createRTTProvider: (xrSessionManager: WebXRSessionManager) => WebXRLayerRenderTargetTextureProvider<LayerTypeT>,
        /**
         * The Babylon node whose world position and rotation are applied to the native layer.
         */
        public readonly transformNode: TransformNode,
        private readonly _ownsTransformNode: boolean
    ) {
        super(getWidth, getHeight, layer, layerType, isMultiview, createRTTProvider, null, true, isStatic);
    }

    /**
     * Synchronizes the native layer with the current world transform of the Babylon node.
     * @param useRightHandedSystem whether the Babylon scene uses right-handed coordinates
     * @param worldScalingFactor the number of Babylon scene units represented by one meter
     */
    public updateFromTransformNode(useRightHandedSystem: boolean, worldScalingFactor: number): void {
        this.transformNode.computeWorldMatrix(true).decompose(undefined, this._currentRotation, this._currentPosition);
        this._currentPosition.scaleInPlace(1 / worldScalingFactor);

        if (!useRightHandedSystem) {
            this._currentPosition.z *= -1;
            this._currentRotation.z *= -1;
            this._currentRotation.w *= -1;
        }

        if (this._currentPosition.equals(this._lastPosition) && this._currentRotation.equals(this._lastRotation)) {
            return;
        }

        this._lastPosition.copyFrom(this._currentPosition);
        this._lastRotation.copyFrom(this._currentRotation);

        const orientation = {
            x: this._currentRotation.x,
            y: this._currentRotation.y,
            z: this._currentRotation.z,
            w: this._currentRotation.w,
        };
        if (this.layerType === "XRCubeLayer") {
            (this.layer as XRCubeLayer).orientation =
                typeof DOMPointReadOnly === "undefined" ? (orientation as DOMPointReadOnly) : new DOMPointReadOnly(orientation.x, orientation.y, orientation.z, orientation.w);
        } else {
            (this.layer as XRQuadLayer | XRCylinderLayer | XREquirectLayer).transform = new XRRigidTransform(
                {
                    x: this._currentPosition.x,
                    y: this._currentPosition.y,
                    z: this._currentPosition.z,
                },
                orientation
            );
        }
    }

    /**
     * Disposes the native layer wrapper and its Babylon transform node when the node was created by Babylon.
     */
    public override dispose(): void {
        super.dispose();
        if (this._ownsTransformNode) {
            this.transformNode.dispose();
        }
    }
}

/**
 * Wraps an XRMediaBinding layer.
 * @typeParam LayerT the concrete media layer type
 */
export class WebXRMediaLayerWrapper<
    LayerT extends Exclude<WebXRSpatialLayer, XRCubeLayer> = Exclude<WebXRSpatialLayer, XRCubeLayer>,
    LayerTypeT extends Exclude<WebXRSpatialLayerType, "XRCubeLayer"> = Exclude<WebXRSpatialLayerType, "XRCubeLayer">,
> extends WebXRSpatialLayerWrapper<LayerT, LayerTypeT> {
    /**
     * Media layers receive their contents directly from the user agent.
     */
    public override readonly isMediaLayer: boolean = true;
    /**
     * Media layers are populated directly by the user agent.
     */
    public override readonly usesRenderTargetProvider: boolean = false;

    /**
     * Creates a wrapper for a media-backed spatial layer.
     * @param getWidth returns the current video width
     * @param getHeight returns the current video height
     * @param layer the native media composition layer
     * @param layerType the concrete spatial layer type
     * @param transformNode the Babylon transform synchronized with the native layer
     * @param ownsTransformNode whether the wrapper should dispose the transform node
     * @param usesSessionReferenceSpace whether the layer should follow session reference-space changes
     */
    constructor(
        getWidth: () => number,
        getHeight: () => number,
        layer: LayerT,
        layerType: LayerTypeT,
        transformNode: TransformNode,
        ownsTransformNode: boolean,
        usesSessionReferenceSpace: boolean
    ) {
        super(
            getWidth,
            getHeight,
            layer,
            layerType,
            false,
            false,
            usesSessionReferenceSpace,
            (sessionManager) => new WebXRNoRenderTargetTextureProvider(sessionManager, this),
            transformNode,
            ownsTransformNode
        );
    }
}

/**
 * Wraps a native cube layer and exposes its raw subimage.
 * Cube layers require six face uploads or render passes and therefore do not use Babylon's 2D composition-layer render target provider.
 */
export class WebXRCubeLayerWrapper extends WebXRSpatialLayerWrapper<XRCubeLayer, "XRCubeLayer"> {
    /**
     * Cube layers are populated through raw cubemap or array-layer access.
     */
    public override readonly usesRenderTargetProvider: boolean = false;

    constructor(
        getWidth: () => number,
        getHeight: () => number,
        layer: XRCubeLayer,
        isStatic: boolean,
        usesSessionReferenceSpace: boolean,
        private readonly _binding: XRWebGLBinding | XRGPUBinding,
        transformNode: TransformNode,
        ownsTransformNode: boolean
    ) {
        super(
            getWidth,
            getHeight,
            layer,
            "XRCubeLayer",
            false,
            isStatic,
            usesSessionReferenceSpace,
            (sessionManager) => new WebXRNoRenderTargetTextureProvider(sessionManager, this),
            transformNode,
            ownsTransformNode
        );
    }

    /**
     * Gets the compositor-owned cube subimage for the current frame.
     * WebGL callers must populate all six cubemap faces. WebGPU callers must render to six consecutive array layers beginning at the descriptor's base array layer.
     * @param frame the current XR frame
     * @param eye the eye to retrieve for stereo cube layers
     * @returns the raw WebGL or WebGPU cube subimage
     */
    public getSubImage(frame: XRFrame, eye?: XREye): XRWebGLSubImage | XRGPUSubImage {
        return this._binding.getSubImage(this.layer, frame, eye);
    }
}

/**
 * Composition layers that are populated outside Babylon do not expose render targets.
 * @internal
 */
class WebXRNoRenderTargetTextureProvider<LayerTypeT extends WebXRSupportedLayerType> extends WebXRLayerRenderTargetTextureProvider<LayerTypeT> {
    /**
     * Creates a no-render-target provider.
     * @param sessionManager the current XR session manager
     * @param layerWrapper the composition layer wrapper
     */
    constructor(sessionManager: WebXRSessionManager, layerWrapper: WebXRCompositionLayerWrapper<XRCompositionLayer, LayerTypeT>) {
        super(sessionManager.scene, layerWrapper);
    }

    /**
     * Media layers do not expose a viewport.
     * @param _viewport unused viewport
     * @param _view unused XR view
     * @returns always `false`
     */
    public trySetViewportForView(_viewport: Viewport, _view: XRView): boolean {
        return false;
    }

    /**
     * Media layers do not expose render target textures.
     * @param _eye unused XR eye
     * @returns always `null`
     */
    public getRenderTargetTextureForEye(_eye: XREye): Nullable<RenderTargetTexture> {
        return null;
    }

    /**
     * Media layers do not expose render target textures.
     * @param _view unused XR view
     * @returns always `null`
     */
    public getRenderTargetTextureForView(_view: XRView): Nullable<RenderTargetTexture> {
        return null;
    }
}

/**
 * Provides render target textures and other important rendering information for a given XRCompositionLayer.
 * @internal
 */
export class WebXRCompositionLayerRenderTargetTextureProvider<
    LayerTypeT extends WebXRSupportedLayerType = WebXRLayerType,
> extends WebXRWebGLRenderTargetTextureProvider<LayerTypeT> {
    protected _lastSubImages = new Map<XREye, XRWebGLSubImage>();
    private _compositionLayer: XRCompositionLayer;
    /**
     * Fires every time a new render target texture is created (either for eye, for view, or for the entire frame)
     */
    public onRenderTargetTextureCreatedObservable = new Observable<{ texture: RenderTargetTexture; eye?: XREye }>();

    constructor(
        protected readonly _xrSessionManager: WebXRSessionManager,
        protected readonly _xrWebGLBinding: XRWebGLBinding,
        public override readonly layerWrapper: WebXRCompositionLayerWrapper<XRCompositionLayer, LayerTypeT>
    ) {
        super(_xrSessionManager.scene, layerWrapper);
        this._compositionLayer = layerWrapper.layer;
    }

    protected _getRenderTargetForSubImage(subImage: XRWebGLSubImage, eye: XREye = "none") {
        const lastSubImage = this._lastSubImages.get(eye);
        const eyeIndex = eye == "right" ? 1 : 0;

        const colorTextureWidth = subImage.colorTextureWidth ?? subImage.textureWidth;
        const colorTextureHeight = subImage.colorTextureHeight ?? subImage.textureHeight;

        if (!this._renderTargetTextures[eyeIndex] || lastSubImage?.textureWidth !== colorTextureWidth || lastSubImage?.textureHeight !== colorTextureHeight) {
            let depthStencilTexture;
            const depthStencilTextureWidth = subImage.depthStencilTextureWidth ?? colorTextureWidth;
            const depthStencilTextureHeight = subImage.depthStencilTextureHeight ?? colorTextureHeight;
            if (colorTextureWidth === depthStencilTextureWidth || colorTextureHeight === depthStencilTextureHeight) {
                depthStencilTexture = subImage.depthStencilTexture;
            }

            this._renderTargetTextures[eyeIndex] = this._createRenderTargetTexture(
                colorTextureWidth,
                colorTextureHeight,
                null,
                subImage.colorTexture,
                depthStencilTexture,
                this.layerWrapper.isMultiview
            );

            this._framebufferDimensions = {
                framebufferWidth: colorTextureWidth,
                framebufferHeight: colorTextureHeight,
            };
            this.onRenderTargetTextureCreatedObservable.notifyObservers({ texture: this._renderTargetTextures[eyeIndex], eye });
        }

        this._lastSubImages.set(eye, subImage);
        return this._renderTargetTextures[eyeIndex];
    }
    private _getSubImageForEye(eye?: XREye): Nullable<XRWebGLSubImage> {
        const currentFrame = this._xrSessionManager.currentFrame;
        if (currentFrame) {
            return this._xrWebGLBinding.getSubImage(this._compositionLayer, currentFrame, eye);
        }
        return null;
    }
    public getRenderTargetTextureForEye(eye?: XREye): Nullable<RenderTargetTexture> {
        const subImage = this._getSubImageForEye(eye);
        if (subImage) {
            return this._getRenderTargetForSubImage(subImage, eye);
        }
        return null;
    }
    public getRenderTargetTextureForView(view?: XRView): Nullable<RenderTargetTexture> {
        return this.getRenderTargetTextureForEye(view?.eye);
    }

    protected _setViewportForSubImage(viewport: Viewport, subImage: XRWebGLSubImage) {
        const textureWidth = subImage.colorTextureWidth ?? subImage.textureWidth;
        const textureHeight = subImage.colorTextureHeight ?? subImage.textureHeight;
        const xrViewport = subImage.viewport;
        viewport.x = xrViewport.x / textureWidth;
        viewport.y = xrViewport.y / textureHeight;
        viewport.width = xrViewport.width / textureWidth;
        viewport.height = xrViewport.height / textureHeight;
    }

    public trySetViewportForView(viewport: Viewport, view: XRView): boolean {
        const subImage = this._lastSubImages.get(view.eye) || this._getSubImageForEye(view.eye);
        if (subImage) {
            this._setViewportForSubImage(viewport, subImage);
            return true;
        }
        return false;
    }
}
