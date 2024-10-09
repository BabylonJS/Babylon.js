// eslint-disable-next-line import/no-internal-modules
import type { DrawWrapper, Nullable, PostProcessCore, Scene } from "core/index";
import { SerializationHelper } from "core/Misc/decorators.serialization";

export abstract class AbstractPostProcessImpl {
    /**
     * Gets a string identifying the name of the class
     * @returns the name of the class
     */
    public abstract getClassName(): string;

    public readonly postProcess: PostProcessCore;

    protected readonly _drawWrapper: DrawWrapper;

    constructor(postProcess: PostProcessCore) {
        this.postProcess = postProcess;
        this._drawWrapper = postProcess.getDrawWrapper();
    }

    public abstract bind(..._args: any): void;

    public parse(parsedPostProcess: any, scene: Nullable<Scene>, rootUrl: string) {
        SerializationHelper.ParseProperties(parsedPostProcess, this, scene, rootUrl);
    }
}
