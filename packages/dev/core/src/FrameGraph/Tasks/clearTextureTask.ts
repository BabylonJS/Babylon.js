import { Color4 } from "core/Maths/math.color";
import type { FrameGraph } from "../frameGraph";
import type { TextureHandle } from "../frameGraphTextureManager";
import type { FrameGraphTaskTexture, IFrameGraphTask } from "./IFrameGraphTask";

export type FrameGraphClearTextureTaskParameters = {
    color?: Color4;
    clearColor?: boolean;
    clearDepth?: boolean;
    clearStencil?: boolean;
    outputTexture?: FrameGraphTaskTexture | TextureHandle;
};

export class FrameGraphClearTextureTask implements IFrameGraphTask {
    public disabled = false;

    public color = new Color4(0.2, 0.2, 0.3, 1);

    public clearColor = true;

    public clearDepth = false;

    public clearStencil = false;

    public outputTexture?: FrameGraphTaskTexture | TextureHandle;

    constructor(
        public name: string,
        options?: FrameGraphClearTextureTaskParameters
    ) {
        this.color = options?.color ?? this.color;
        this.clearColor = options?.clearColor ?? this.clearColor;
        this.clearDepth = options?.clearDepth ?? this.clearDepth;
        this.clearStencil = options?.clearStencil ?? this.clearStencil;
        this.outputTexture = options?.outputTexture;
    }

    public isReadyFrameGraph() {
        return true;
    }

    public recordFrameGraph(frameGraph: FrameGraph) {
        if (this.outputTexture === undefined) {
            throw new Error("outputTexture is required");
        }

        const outputTextureHandle = frameGraph.getTextureHandle(this.outputTexture);

        const pass = frameGraph.addRenderPass("clear texture");

        pass.setRenderTarget(outputTextureHandle);
        pass.setExecuteFunc((context) => {
            context.clear(this.color, !!this.clearColor, !!this.clearDepth, !!this.clearStencil);
        });

        const passDisabled = frameGraph.addRenderPass("clear texture_disabled", true);

        passDisabled.setRenderTarget(outputTextureHandle);
        passDisabled.setExecuteFunc((_context) => {});
    }
}
