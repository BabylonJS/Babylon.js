import { WebGLHardwareTexture } from "../Engines/WebGL/webGLHardwareTexture";
import { WebGLRenderTargetWrapper } from "../Engines/WebGL/webGLRenderTargetWrapper";
import { InternalTexture, InternalTextureSource } from "../Materials/Textures/internalTexture";
import { RenderTargetTexture } from "../Materials/Textures/renderTargetTexture";
import { Viewport } from "../Maths/math.viewport";
import { Scene } from "../scene";
import { Nullable } from "../types";

/**
 * Provides render target textures and other important rendering information for a given XRLayer.
 * @hidden
 */
export abstract class WebXRRenderTargetProvider {
    public abstract trySetViewportForView(viewport: Viewport, view: XRView): boolean;
    public abstract getRenderTargetForEye(eye: XREye): Nullable<RenderTargetTexture>;
    public abstract getRenderTargetForView(view: XRView): Nullable<RenderTargetTexture>;
    public abstract getFramebufferDimensions(): Nullable<{ framebufferWidth: number, framebufferHeight: number }>;

    protected _renderTargetTextures = new Array<RenderTargetTexture>();

    constructor(private readonly _scene: Scene, public readonly layer: XRLayer) {
    }

    protected _createRenderTargetTexture(
        width: number,
        height: number,
        framebuffer: Nullable<WebGLFramebuffer>,
        colorTexture?: WebGLHardwareTexture,
        depthStencilTexture?: WebGLHardwareTexture): RenderTargetTexture {
        const engine = this._scene.getEngine();
        if (!engine) {
            throw new Error("Engine is disposed");
        }

        // Create render target texture from the internal texture
        const renderTargetTexture = new RenderTargetTexture("XR renderTargetTexture", { width, height }, this._scene);
        const renderTargetWrapper = renderTargetTexture.renderTarget!;
        if (!!framebuffer) {
            (renderTargetWrapper as WebGLRenderTargetWrapper)._framebuffer = framebuffer;
        }

        // Create internal texture
        const internalTexture = new InternalTexture(engine, InternalTextureSource.Unknown, true);
        internalTexture.width = width;
        internalTexture.height = height;
        if (!!colorTexture) {
            internalTexture._hardwareTexture = colorTexture;
        }
        renderTargetWrapper.setTexture(internalTexture, 0);
        renderTargetTexture._texture = internalTexture;

        if (!!depthStencilTexture) {
            const internalDSTexture = new InternalTexture(engine, InternalTextureSource.DepthStencil, true);
            internalDSTexture.width = width;
            internalDSTexture.height = height;
            internalDSTexture._hardwareTexture = depthStencilTexture;
            renderTargetWrapper._depthStencilTexture = internalDSTexture;
        }

        renderTargetTexture.disableRescaling();
        // WebXR pre-clears textures
        renderTargetTexture.skipInitialClear = true;

        this._renderTargetTextures.push(renderTargetTexture);

        return renderTargetTexture;
    }

    protected _destroyRenderTargetTexture(renderTargetTexture: RenderTargetTexture) {
        this._renderTargetTextures.splice(this._renderTargetTextures.indexOf(renderTargetTexture), 1);
        renderTargetTexture.dispose();
    }

    public dispose() {
        this._renderTargetTextures.forEach((rtt) => rtt.dispose());
        this._renderTargetTextures.length = 0;
    }
}

/**
 * Provides render target textures and other important rendering information for a given XRWebGLLayer.
 * @hidden
 */
export class XRWebGLLayerRenderTargetProvider extends WebXRRenderTargetProvider {
    private _rtt: Nullable<RenderTargetTexture>;
    private _framebuffer: WebGLFramebuffer;
    private _framebufferWidth: number;
    private _framebufferHeight: number;

    constructor(scene: Scene, private readonly _layer: XRWebGLLayer) {
        super(scene, _layer);
    }

    public trySetViewportForView(viewport: Viewport, view: XRView): boolean {
        const xrViewport = this._layer.getViewport(view);
        const framebufferWidth = this._layer.framebufferWidth;
        const framebufferHeight = this._layer.framebufferHeight;
        viewport.x = xrViewport.x / framebufferWidth;
        viewport.y = xrViewport.y / framebufferHeight;
        viewport.width = xrViewport.width / framebufferWidth;
        viewport.height = xrViewport.height / framebufferHeight;
        return true;
    }

    public getRenderTargetForEye(eye: XREye): Nullable<RenderTargetTexture> {
        const layerWidth = this._layer.framebufferWidth;
        const layerHeight = this._layer.framebufferHeight;
        const framebuffer = this._layer.framebuffer;

        if (!this._rtt ||
            layerWidth !== this._framebufferWidth ||
            layerHeight !== this._framebufferHeight ||
            framebuffer !== this._framebuffer) {
            if (this._rtt) {
                this._rtt.dispose();
            }
            this._rtt = this._createRenderTargetTexture(layerWidth, layerHeight, framebuffer);
            this._framebufferWidth = layerWidth;
            this._framebufferHeight = layerHeight;
            this._framebuffer = framebuffer;
        }

        return this._rtt;
    }

    public getRenderTargetForView(view: XRView): Nullable<RenderTargetTexture> {
        return this.getRenderTargetForEye(view.eye);
    }

    public getFramebufferDimensions(): Nullable<{ framebufferWidth: number; framebufferHeight: number; }> {
        return { framebufferWidth: this._layer.framebufferWidth, framebufferHeight: this._layer.framebufferHeight };
    }
}