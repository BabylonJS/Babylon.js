import type { IFrameGraphPass } from "../Passes/IFrameGraphPass";
import { FrameGraphRenderPass } from "../Passes/renderPass";
import type { IFrameGraphTask } from "./IFrameGraphTask";
import type { TextureHandle } from "../../Engines/textureHandleManager";

/** @internal */
export class FrameGraphTaskInternals {
    private _passes: IFrameGraphPass[] = [];
    private _passesDisabled: IFrameGraphPass[] = [];

    public mapNameToTextureHandle: { [name: string]: TextureHandle } = {};

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
        let outputTexture: TextureHandle | undefined;

        for (const pass of this._passes!) {
            const errMsg = pass._isValid();
            if (errMsg) {
                throw new Error(`Pass "${pass.name}" is not valid. ${errMsg}`);
            }
            if (FrameGraphRenderPass.IsRenderPass(pass)) {
                outputTexture = pass.renderTarget;
            }
        }

        let disabledOutputTexture: TextureHandle | undefined;

        for (const pass of this._passesDisabled!) {
            const errMsg = pass._isValid();
            if (errMsg) {
                throw new Error(`Pass "${pass.name}" is not valid. ${errMsg}`);
            }
            if (FrameGraphRenderPass.IsRenderPass(pass)) {
                disabledOutputTexture = pass.renderTarget;
            }
        }

        if (outputTexture !== disabledOutputTexture && this._passesDisabled.length > 0) {
            throw new Error(`The output texture of the task "${this._task.name}" is different when it is enabled or disabled.`);
        }

        if (outputTexture !== undefined) {
            this.mapNameToTextureHandle["output"] = outputTexture;
        }
    }

    public getPasses(): IFrameGraphPass[] {
        return this._task.disabled && this._passesDisabled.length > 0 ? this._passesDisabled : this._passes;
    }
}
