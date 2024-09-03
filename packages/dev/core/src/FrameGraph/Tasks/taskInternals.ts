import type { FrameGraphObjectList, FrameGraphTextureHandle, IFrameGraphPass, IFrameGraphTask } from "../frameGraphTypes";
import { FrameGraphCullPass } from "../Passes/cullPass";
import { FrameGraphRenderPass } from "../Passes/renderPass";

/** @internal */
export class FrameGraphTaskInternals {
    private _passes: IFrameGraphPass[] = [];
    private _passesDisabled: IFrameGraphPass[] = [];

    public mapNameToTextureHandle: { [name: string]: FrameGraphTextureHandle } = {};

    public mapNameToObjectList: { [name: string]: FrameGraphObjectList } = {};

    constructor(private _task: IFrameGraphTask) {
        this.reset();
    }

    public reset() {
        this._passes.length = 0;
        this._passesDisabled.length = 0;
        this.mapNameToTextureHandle = {};
    }

    public addPass(pass: IFrameGraphPass, disabled: boolean) {
        if (disabled) {
            this._passesDisabled.push(pass);
        } else {
            this._passes.push(pass);
        }
    }

    public dispose() {
        this.reset();
    }

    public postBuildTask() {
        let outputTexture: FrameGraphTextureHandle | undefined;
        let outputDepthTexture: FrameGraphTextureHandle | undefined;
        let outputObjectList: FrameGraphObjectList | undefined;

        for (const pass of this._passes!) {
            const errMsg = pass._isValid();
            if (errMsg) {
                throw new Error(`Pass "${pass.name}" is not valid. ${errMsg}`);
            }
            if (FrameGraphRenderPass.IsRenderPass(pass)) {
                outputTexture = pass.renderTarget;
                outputDepthTexture = pass.renderTargetDepth;
                for (const outputTexture of pass.outputTextures) {
                    this.mapNameToTextureHandle[outputTexture.name] = outputTexture.handle;
                }
            } else if (FrameGraphCullPass.IsCullPass(pass)) {
                outputObjectList = pass.objectList;
            }
        }

        let disabledOutputTexture: FrameGraphTextureHandle | undefined;
        let disabledOutputDepthTexture: FrameGraphTextureHandle | undefined;
        let disabledOutputObjectList: FrameGraphObjectList | undefined;

        for (const pass of this._passesDisabled!) {
            const errMsg = pass._isValid();
            if (errMsg) {
                throw new Error(`Pass "${pass.name}" is not valid. ${errMsg}`);
            }
            if (FrameGraphRenderPass.IsRenderPass(pass)) {
                disabledOutputTexture = pass.renderTarget;
                disabledOutputDepthTexture = pass.renderTargetDepth;
            } else if (FrameGraphCullPass.IsCullPass(pass)) {
                disabledOutputObjectList = pass.objectList;
            }
        }

        if (this._passesDisabled.length > 0) {
            if (outputTexture !== disabledOutputTexture) {
                throw new Error(`The output texture of the task "${this._task.name}" is different when it is enabled or disabled.`);
            }
            if (outputDepthTexture !== disabledOutputDepthTexture) {
                throw new Error(`The output depth texture of the task "${this._task.name}" is different when it is enabled or disabled.`);
            }
            if (outputObjectList !== disabledOutputObjectList) {
                throw new Error(`The output object list of the task "${this._task.name}" is different when it is enabled or disabled.`);
            }
        }

        if (outputTexture !== undefined) {
            this.mapNameToTextureHandle["output"] = outputTexture;
        }
        if (outputDepthTexture !== undefined) {
            this.mapNameToTextureHandle["outputDepth"] = outputDepthTexture;
        }
        if (outputObjectList !== undefined) {
            this.mapNameToObjectList["output"] = outputObjectList;
        }
    }

    public getPasses(): IFrameGraphPass[] {
        return this._task.disabled && this._passesDisabled.length > 0 ? this._passesDisabled : this._passes;
    }
}
