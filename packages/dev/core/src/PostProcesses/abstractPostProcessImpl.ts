// eslint-disable-next-line import/no-internal-modules
import type { DrawWrapper, Nullable, PostProcessCore, Scene } from "core/index";
import { SerializationHelper } from "core/Misc/decorators.serialization";

export abstract class AbstractPostProcessImpl {
    /**
     * Gets a string identifying the name of the class
     * @returns the name of the class
     */
    public abstract getClassName(): string;

    public postProcess: PostProcessCore;

    protected _drawWrapper: DrawWrapper;

    constructor(postProcess?: PostProcessCore) {
        if (postProcess) {
            this.linkToPostProcess(postProcess);
        }
    }

    public abstract bind(..._args: any): void;

    public isReady() {
        return this.postProcess ? this.postProcess.isReady() : false;
    }

    public linkToPostProcess(postProcess: PostProcessCore) {
        this.postProcess = postProcess;
        this._drawWrapper = postProcess.getDrawWrapper();
    }

    public parse(parsedPostProcess: any, scene: Nullable<Scene>, rootUrl: string) {
        SerializationHelper.ParseProperties(parsedPostProcess, this, scene, rootUrl);
    }
}
