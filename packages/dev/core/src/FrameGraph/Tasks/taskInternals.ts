import type { IFrameGraphPass } from "../Passes/IFrameGraphPass";
import { FrameGraphRenderPass } from "../Passes/renderPass";
import type { FrameGraphTextureManager, TextureHandle } from "../frameGraphTextureManager";
import type { IFrameGraphTask } from "./IFrameGraphTask";

/** @internal */
export class FrameGraphTaskInternals {
    public passes: IFrameGraphPass[] = [];
    public passesDisabled: IFrameGraphPass[] = [];
    public outputTexture?: TextureHandle;
    public outputTextureWhenEnabled?: TextureHandle;
    public outputTextureWhenDisabled?: TextureHandle;

    public mapNameToTextureHandle: { [name: string]: TextureHandle } = {};

    constructor(
        private _task: IFrameGraphTask,
        private _textureManager: FrameGraphTextureManager
    ) {
        this.reset();
    }

    public reset() {
        this.passes.length = 0;
        this.passesDisabled.length = 0;
        this.outputTexture = undefined;
        this.outputTextureWhenEnabled = undefined;
        this.outputTextureWhenDisabled = undefined;
        this.mapNameToTextureHandle = {};
    }

    public dispose() {
        this.reset();
    }

    public postBuildTask() {
        for (const pass of this.passes!) {
            const errMsg = pass._isValid();
            if (errMsg) {
                throw new Error(`Pass "${pass.name}" is not valid. ${errMsg}`);
            }
            if (FrameGraphRenderPass.IsRenderPass(pass)) {
                this.outputTextureWhenEnabled = pass.renderTarget;
            }
        }

        for (const pass of this.passesDisabled!) {
            const errMsg = pass._isValid();
            if (errMsg) {
                throw new Error(`Pass "${pass.name}" is not valid. ${errMsg}`);
            }
            if (FrameGraphRenderPass.IsRenderPass(pass)) {
                this.outputTextureWhenDisabled = pass.renderTarget;
            }
        }

        if (this.outputTextureWhenEnabled !== undefined || this.outputTextureWhenDisabled !== undefined) {
            this.outputTextureWhenEnabled = this.outputTextureWhenEnabled ?? this.outputTextureWhenDisabled;
            this.outputTextureWhenDisabled = this.outputTextureWhenDisabled ?? this.outputTextureWhenEnabled;
            this.outputTexture = this._textureManager._createProxyHandle(`${this._task.name} Proxy`);
            this.mapNameToTextureHandle["output"] = this.outputTexture;
            // We need to call the function at build time to ensure that the output texture is correctly defined
            // in case another task needs to access the current task's output texture description during its own build
            this.setTextureOutputForTask();
        }
    }

    public setTextureOutputForTask(): void {
        if (this.outputTexture === undefined) {
            return;
        }

        if (this._task.disabled) {
            this._textureManager._textures[this.outputTexture]!.texture = this._textureManager._textures[this.outputTextureWhenDisabled!]!.texture;
            this._textureManager._textures[this.outputTexture]!.systemType = this._textureManager._textures[this.outputTextureWhenDisabled!]!.systemType;
            this._textureManager._textureCreationOptions[this.outputTexture] = this._textureManager._textureCreationOptions[this.outputTextureWhenDisabled!];
        } else {
            this._textureManager._textures[this.outputTexture]!.texture = this._textureManager._textures[this.outputTextureWhenEnabled!]!.texture;
            this._textureManager._textures[this.outputTexture]!.systemType = this._textureManager._textures[this.outputTextureWhenEnabled!]!.systemType;
            this._textureManager._textureCreationOptions[this.outputTexture] = this._textureManager._textureCreationOptions[this.outputTextureWhenEnabled!];
        }
    }
}
