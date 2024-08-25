import type { AbstractEngine } from "core/Engines/abstractEngine";
import type { IFrameGraphPass } from "../Passes/IFrameGraphPass";
import { FrameGraphRenderPass } from "../Passes/renderPass";
import type { IFrameGraphTask } from "./IFrameGraphTask";
import type { TextureHandle } from "../../Engines/textureHandlerManager";

/** @internal */
export class FrameGraphTaskInternals {
    private _passes: IFrameGraphPass[] = [];
    private _passesDisabled: IFrameGraphPass[] = [];

    private _outputTexture?: TextureHandle;
    private _outputTextureWhenEnabled?: TextureHandle;
    private _outputTextureWhenDisabled?: TextureHandle;

    public mapNameToTextureHandle: { [name: string]: TextureHandle } = {};

    constructor(
        private _engine: AbstractEngine,
        private _task: IFrameGraphTask
    ) {
        this.reset();
    }

    public reset() {
        this._passes.length = 0;
        this._passesDisabled.length = 0;
        this._outputTexture = undefined;
        this._outputTextureWhenEnabled = undefined;
        this._outputTextureWhenDisabled = undefined;
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
        for (const pass of this._passes!) {
            const errMsg = pass._isValid();
            if (errMsg) {
                throw new Error(`Pass "${pass.name}" is not valid. ${errMsg}`);
            }
            if (FrameGraphRenderPass.IsRenderPass(pass)) {
                this._outputTextureWhenEnabled = pass.renderTarget;
            }
        }

        if (this._task.disabled !== undefined) {
            for (const pass of this._passesDisabled!) {
                const errMsg = pass._isValid();
                if (errMsg) {
                    throw new Error(`Pass "${pass.name}" is not valid. ${errMsg}`);
                }
                if (FrameGraphRenderPass.IsRenderPass(pass)) {
                    this._outputTextureWhenDisabled = pass.renderTarget;
                }
            }
        }

        if (this._outputTextureWhenEnabled !== undefined || this._outputTextureWhenDisabled !== undefined) {
            this._outputTextureWhenEnabled = this._outputTextureWhenEnabled ?? this._outputTextureWhenDisabled;
            if (this._task.disabled !== undefined) {
                this._outputTextureWhenDisabled = this._outputTextureWhenDisabled ?? this._outputTextureWhenEnabled;
                this._outputTexture = this._engine._textureHandleManager.createHandleAsProxy(`${this._task.name} Proxy`, this._outputTextureWhenEnabled!);
                this.mapNameToTextureHandle["output"] = this._outputTexture;
                // We need to call the function at build time to ensure that the output texture is correctly defined
                // in case another task needs to access the current task's output texture description during its own build
                this._setTextureOutputForTask();
            } else {
                this.mapNameToTextureHandle["output"] = this._outputTextureWhenEnabled!;
            }
        }
    }

    public getPasses(): IFrameGraphPass[] {
        if (this._outputTexture === undefined) {
            return this._passes;
        }

        this._setTextureOutputForTask();

        return this._task.disabled ? this._passesDisabled : this._passes;
    }

    private _setTextureOutputForTask(): void {
        if (this._task.disabled && this._outputTextureWhenDisabled !== undefined) {
            this._engine._textureHandleManager.setTargetHandleForProxy(this._outputTexture!, this._outputTextureWhenDisabled);
        } else {
            this._engine._textureHandleManager.setTargetHandleForProxy(this._outputTexture!, this._outputTextureWhenEnabled!);
        }
    }
}
