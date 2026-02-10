import type { AbstractEngine, FrameGraphTextureManager, Scene, FrameGraphTextureHandle, Nullable, InternalTexture, IViewportLike } from "core/index";

/**
 * Base class for frame graph context.
 */
export class FrameGraphContext {
    private _depthTest: boolean;
    private _depthWrite: boolean;

    /**
     * If true, debug markers will be enabled in the context.
     */
    public enableDebugMarkers = true;

    /** @internal */
    constructor(
        protected readonly _engine: AbstractEngine,
        protected readonly _textureManager: FrameGraphTextureManager,
        protected readonly _scene: Scene
    ) {}

    /**
     * Renders a component without managing the render target.
     * Use this method when you have a component that handles its own rendering logic which is not fully integrated into the frame graph system.
     * @param component The component to render.
     * @param intermediateRendering If true, the scene's intermediate rendering flag will be set to true during the render call (default: true)
     */
    public renderUnmanaged(component: { render: () => void }, intermediateRendering = true): void {
        const currentRenderTarget = this._engine._currentRenderTarget;

        this._scene.incrementRenderId();
        this._scene.resetCachedMaterial();

        this._scene._intermediateRendering = intermediateRendering;

        component.render();

        this._scene._intermediateRendering = false;

        if (this._engine._currentRenderTarget !== currentRenderTarget) {
            if (!currentRenderTarget) {
                this._engine.restoreDefaultFramebuffer(true);
            } else {
                this._engine.bindFramebuffer(currentRenderTarget);
            }
        }
    }

    /**
     * Gets a texture from a handle.
     * Note that if the texture is a history texture, the read texture for the current frame will be returned.
     * @param handle The handle of the texture
     * @returns The texture or null if not found
     */
    public getTextureFromHandle(handle: FrameGraphTextureHandle): Nullable<InternalTexture> {
        return this._textureManager.getTextureFromHandle(handle);
    }

    /**
     * Pushes a debug group to the engine's debug stack.
     * @param name The name of the debug group
     */
    public pushDebugGroup(name: string) {
        this.enableDebugMarkers && this._engine._debugPushGroup?.(name);
    }

    /**
     * Pops a debug group from the engine's debug stack.
     */
    public popDebugGroup() {
        this.enableDebugMarkers && this._engine._debugPopGroup?.();
    }

    /**
     * Inserts a debug marker in the engine's debug stack.
     * @param text The text of the debug marker
     */
    public insertDebugMarker(text: string) {
        this.enableDebugMarkers && this._engine._debugInsertMarker?.(text);
    }

    /**
     * Saves the current depth states (depth testing and depth writing)
     */
    public saveDepthStates(): void {
        this._depthTest = this._engine.getDepthBuffer();
        this._depthWrite = this._engine.getDepthWrite();
    }

    /**
     * Restores the depth states saved by saveDepthStates
     */
    public restoreDepthStates(): void {
        this._engine.setDepthBuffer(this._depthTest);
        this._engine.setDepthWrite(this._depthWrite);
    }

    /**
     * Sets the depth states for the current render target
     * @param depthTest If true, depth testing is enabled
     * @param depthWrite If true, depth writing is enabled
     */
    public setDepthStates(depthTest: boolean, depthWrite: boolean): void {
        this._engine.setDepthBuffer(depthTest);
        this._engine.setDepthWrite(depthWrite);
    }

    /**
     * Sets the current viewport
     * @param viewport defines the viewport element to be used
     * @param requiredWidth defines the width required for rendering. If not provided, the width of the render texture is used.
     * @param requiredHeight defines the height required for rendering. If not provided the height of the render texture is used.
     */
    public setViewport(viewport: IViewportLike, requiredWidth?: number, requiredHeight?: number): void {
        this._engine.setViewport(viewport, requiredHeight, requiredWidth);
    }
}
