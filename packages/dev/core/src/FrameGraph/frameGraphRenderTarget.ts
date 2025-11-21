import type { FrameGraphTextureHandle, FrameGraphTextureManager, IMultiRenderTargetOptions, RenderTargetWrapper } from "core/index";

/**
 * @internal
 * @experimental
 */
export class FrameGraphRenderTarget {
    protected readonly _textureManager: FrameGraphTextureManager;
    protected readonly _renderTargets: FrameGraphTextureHandle[] | undefined;
    protected readonly _renderTargetDepth: FrameGraphTextureHandle | undefined;
    protected _renderTargetWrapper: RenderTargetWrapper | undefined;
    protected _isBackBuffer = false;

    public readonly name: string;

    constructor(
        name: string,
        textureManager: FrameGraphTextureManager,
        renderTargets?: FrameGraphTextureHandle | FrameGraphTextureHandle[],
        renderTargetDepth?: FrameGraphTextureHandle
    ) {
        this.name = name;
        this._textureManager = textureManager;
        this._renderTargets = renderTargets === undefined ? undefined : Array.isArray(renderTargets) ? renderTargets : [renderTargets];
        this._renderTargetDepth = renderTargetDepth;
    }

    public get renderTargetWrapper() {
        if (this._isBackBuffer) {
            return undefined;
        }

        if (!this._renderTargetWrapper) {
            const engine = this._textureManager.engine;

            // _renderTargets and _renderTargetDepth cannot both be undefined
            const textureHandle = this._renderTargets === undefined || this._renderTargets.length === 0 ? this._renderTargetDepth! : this._renderTargets[0];

            if (this._textureManager.isBackbuffer(textureHandle)) {
                this._isBackBuffer = true;
                return undefined;
            }

            const textureDescription = this._textureManager.getTextureDescription(textureHandle);

            const creationOptionsForTexture: IMultiRenderTargetOptions = {
                textureCount: this._renderTargets?.length ?? 0,
                generateDepthBuffer: false,
                label: this.name,
                samples: textureDescription.options.samples ?? 1,
                dontCreateTextures: true,
            };

            this._renderTargetWrapper = engine.createMultipleRenderTarget(textureDescription.size, creationOptionsForTexture, true);

            for (let i = 0; i < creationOptionsForTexture.textureCount!; i++) {
                const handle = this._renderTargets![i];
                const texture = this._textureManager.getTextureFromHandle(handle);

                if (!texture) {
                    throw new Error(
                        `FrameGraphRenderTarget.renderTargetWrapper: Failed to get texture from handle. handle: ${handle}, name: ${this.name}, index: ${i}, renderTargets: ${this._renderTargets}`
                    );
                }

                this._renderTargetWrapper.setTexture(texture, i, false);
            }

            if (this._renderTargetDepth !== undefined) {
                this._renderTargetWrapper.setDepthStencilTexture(this._textureManager.getTextureFromHandle(this._renderTargetDepth), false);
            }
        }

        return this._renderTargetWrapper;
    }

    public equals(other: FrameGraphRenderTarget): boolean {
        const src = this._renderTargets;
        const dst = other._renderTargets;

        if (src !== undefined && dst !== undefined) {
            if (src.length !== dst.length) {
                return false;
            }

            for (let i = 0; i < src.length; i++) {
                if (src[i] !== dst[i]) {
                    return false;
                }
            }
        } else if ((src === undefined && dst !== undefined) || (src !== undefined && dst === undefined)) {
            return false;
        }

        return this._renderTargetDepth === other._renderTargetDepth;
    }
}
