import type {
    AbstractEngine,
    FrameGraphTextureManager,
    Scene,
    FrameGraphTextureHandle,
    Nullable,
    InternalTexture,
    // eslint-disable-next-line import/no-internal-modules
} from "core/index";

/**
 * Base class for frame graph context.
 */
export class FrameGraphContext {
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
     */
    public renderUnmanaged(component: { render: () => void }): void {
        const currentRenderTarget = this._engine._currentRenderTarget;

        this._scene.incrementRenderId();
        this._scene.resetCachedMaterial();

        component.render();

        if (this._engine._currentRenderTarget !== currentRenderTarget) {
            if (!currentRenderTarget) {
                this._engine.restoreDefaultFramebuffer();
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
        this._engine._debugPushGroup?.(name, 1);
    }

    /**
     * Pops a debug group from the engine's debug stack.
     */
    public popDebugGroup() {
        this._engine._debugPopGroup?.(1);
    }
}
