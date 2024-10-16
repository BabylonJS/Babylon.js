// eslint-disable-next-line import/no-internal-modules
import type { DrawWrapper, PostProcessCore } from "core/index";

export abstract class AbstractPostProcessImpl {
    public postProcess: PostProcessCore;

    protected _drawWrapper: DrawWrapper;

    constructor(postProcess?: PostProcessCore) {
        if (postProcess) {
            this.linkToPostProcess(postProcess);
        }
    }

    public abstract bind(..._args: any): void;

    public abstract gatherImports(_useWebGPU: boolean, _list: Promise<any>[]): void;

    public isReady() {
        return this.postProcess ? this.postProcess.isReady() : false;
    }

    public linkToPostProcess(postProcess: PostProcessCore) {
        this.postProcess = postProcess;
        this._drawWrapper = postProcess.getDrawWrapper();
    }
}
