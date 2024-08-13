import type { IFrameGraphPass } from "../Passes/IFrameGraphPass";
import { FrameGraphRenderPassBuilder } from "../Passes/renderPassBuilder";
import type { FrameGraphTextureManager, TextureHandle } from "../frameGraphTextureManager";
import type { IFrameGraphInputData } from "./IFrameGraphTask";

/** @internal */
export class FrameGraphTaskInternals {
    public passes: IFrameGraphPass[] = [];
    public passesDisabled: IFrameGraphPass[] = [];
    public inputData?: IFrameGraphInputData;
    public outputTexture?: TextureHandle;
    public outputTextureWhenEnabled?: TextureHandle;
    public outputTextureWhenDisabled?: TextureHandle;
    public wasDisabled: boolean;

    constructor(
        private _textureManager: FrameGraphTextureManager,
        inputData?: IFrameGraphInputData
    ) {
        this.inputData = inputData;
        this.reset();
    }

    public reset() {
        this.passes.length = 0;
        this.passesDisabled.length = 0;
        this.outputTexture = undefined;
        this.outputTextureWhenEnabled = undefined;
        this.outputTextureWhenDisabled = undefined;
        this.wasDisabled = false;
    }

    public dispose() {
        this.reset();
    }

    public postBuildTask(taskIsDisabled: boolean) {
        for (const pass of this.passes!) {
            const errMsg = pass._isValid();
            if (errMsg) {
                throw new Error(`Pass "${pass.name}" is not valid. ${errMsg}`);
            }
            if (FrameGraphRenderPassBuilder.IsRenderPassBuilder(pass)) {
                this.outputTextureWhenEnabled = pass.renderTarget;
            }
        }

        for (const pass of this.passesDisabled!) {
            const errMsg = pass._isValid();
            if (errMsg) {
                throw new Error(`Pass "${pass.name}" is not valid. ${errMsg}`);
            }
            if (FrameGraphRenderPassBuilder.IsRenderPassBuilder(pass)) {
                this.outputTextureWhenDisabled = pass.renderTarget;
            }
        }

        if (this.outputTextureWhenEnabled !== undefined || this.outputTextureWhenDisabled !== undefined) {
            this.outputTextureWhenEnabled = this.outputTextureWhenEnabled ?? this.outputTextureWhenDisabled;
            this.outputTextureWhenDisabled = this.outputTextureWhenDisabled ?? this.outputTextureWhenEnabled;
            this.outputTexture = this._textureManager._createProxyHandle();
            this.setTextureOutputForTask(taskIsDisabled, true);
        }
    }

    public setTextureOutputForTask(taskIsDisabled: boolean, force = false): void {
        if (this.outputTexture === undefined || (!force && taskIsDisabled === this.wasDisabled)) {
            return;
        }

        this.wasDisabled = taskIsDisabled;

        if (taskIsDisabled) {
            this._textureManager._textures[this.outputTexture]!.texture = this._textureManager._textures[this.outputTextureWhenDisabled!]!.texture;
            this._textureManager._textures[this.outputTexture]!.systemType = this._textureManager._textures[this.outputTextureWhenDisabled!]!.systemType;
            this._textureManager._textures[this.outputTexture]!.namespace = this._textureManager._textures[this.outputTextureWhenDisabled!]!.namespace;
            this._textureManager._textureDescriptions[this.outputTexture] = this._textureManager._textureDescriptions[this.outputTextureWhenDisabled!];
        } else {
            this._textureManager._textures[this.outputTexture]!.texture = this._textureManager._textures[this.outputTextureWhenEnabled!]!.texture;
            this._textureManager._textures[this.outputTexture]!.systemType = this._textureManager._textures[this.outputTextureWhenEnabled!]!.systemType;
            this._textureManager._textures[this.outputTexture]!.namespace = this._textureManager._textures[this.outputTextureWhenEnabled!]!.namespace;
            this._textureManager._textureDescriptions[this.outputTexture] = this._textureManager._textureDescriptions[this.outputTextureWhenEnabled!];
        }
    }
}
