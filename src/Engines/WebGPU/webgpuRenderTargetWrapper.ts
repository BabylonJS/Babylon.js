import { RenderTargetTextureSize } from "../Extensions/engine.renderTarget";
import { RenderTargetWrapper } from "../renderTargetWrapper"
import { ThinEngine } from "../thinEngine";

/** @hidden */
export class WebGPURenderTargetWrapper extends RenderTargetWrapper {

    constructor(isMulti: boolean, isCube: boolean, size: RenderTargetTextureSize, engine: ThinEngine) {
        super(isMulti, isCube, size, engine);
    }

    public dispose(disposeOnlyFramebuffers = false): void {
        super.dispose(disposeOnlyFramebuffers);
    }

}
