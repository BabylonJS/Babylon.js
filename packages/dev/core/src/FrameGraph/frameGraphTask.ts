import type { RenderTargetWrapper } from "core/Engines/renderTargetWrapper";
import type { FrameGraph } from "./frameGraph";
import type { FrameGraphObjectList } from "./frameGraphObjectList";
import type { IFrameGraphPass } from "./frameGraphTypes";
import { FrameGraphCullPass } from "./Passes/cullPass";
import { FrameGraphRenderPass } from "./Passes/renderPass";
import type { Nullable } from "core/types";

/*
 * @experimental
 */
export abstract class FrameGraphTask {
    protected _frameGraph: FrameGraph;

    private _passes: IFrameGraphPass[] = [];
    private _passesDisabled: IFrameGraphPass[] = [];

    protected _name: string;

    public get name() {
        return this._name;
    }

    public set name(value: string) {
        this._name = value;
    }

    protected _disabled = false;

    public get disabled() {
        return this._disabled;
    }

    public set disabled(value: boolean) {
        this._disabled = value;
    }

    /**
     * Use this function to add content (render passes, ...) to the task
     */
    public abstract record(): void;

    public isReady(): boolean {
        return true;
    }

    public dispose() {
        this._reset();
    }

    constructor(name: string, frameGraph: FrameGraph) {
        this.name = name;
        this._frameGraph = frameGraph;
        this._reset();
    }

    /** @internal */
    public _reset() {
        this._passes.length = 0;
        this._passesDisabled.length = 0;
    }

    /** @internal */
    public _addPass(pass: IFrameGraphPass, disabled: boolean) {
        if (disabled) {
            this._passesDisabled.push(pass);
        } else {
            this._passes.push(pass);
        }
    }

    /** @internal */
    public _checkTask() {
        let outputTexture: Nullable<RenderTargetWrapper> = null;
        let outputDepthTexture: Nullable<RenderTargetWrapper> = null;
        let outputObjectList: FrameGraphObjectList | undefined;

        for (const pass of this._passes!) {
            const errMsg = pass._isValid();
            if (errMsg) {
                throw new Error(`Pass "${pass.name}" is not valid. ${errMsg}`);
            }
            if (FrameGraphRenderPass.IsRenderPass(pass)) {
                outputTexture = this._frameGraph.getTexture(pass.renderTarget);
                outputDepthTexture = pass.renderTargetDepth !== undefined ? this._frameGraph.getTexture(pass.renderTargetDepth) : null;
            } else if (FrameGraphCullPass.IsCullPass(pass)) {
                outputObjectList = pass.objectList;
            }
        }

        let disabledOutputTexture: Nullable<RenderTargetWrapper> = null;
        let disabledOutputDepthTexture: Nullable<RenderTargetWrapper> = null;
        let disabledOutputObjectList: FrameGraphObjectList | undefined;

        for (const pass of this._passesDisabled!) {
            const errMsg = pass._isValid();
            if (errMsg) {
                throw new Error(`Pass "${pass.name}" is not valid. ${errMsg}`);
            }
            if (FrameGraphRenderPass.IsRenderPass(pass)) {
                disabledOutputTexture = this._frameGraph.getTexture(pass.renderTarget);
                disabledOutputDepthTexture = pass.renderTargetDepth !== undefined ? this._frameGraph.getTexture(pass.renderTargetDepth) : null;
            } else if (FrameGraphCullPass.IsCullPass(pass)) {
                disabledOutputObjectList = pass.objectList;
            }
        }

        if (this._passesDisabled.length > 0) {
            if (outputTexture !== disabledOutputTexture) {
                throw new Error(`The output texture of the task "${this.name}" is different when it is enabled or disabled.`);
            }
            if (outputDepthTexture !== disabledOutputDepthTexture) {
                throw new Error(`The output depth texture of the task "${this.name}" is different when it is enabled or disabled.`);
            }
            if (outputObjectList !== disabledOutputObjectList) {
                throw new Error(`The output object list of the task "${this.name}" is different when it is enabled or disabled.`);
            }
        }
    }

    /** @internal */
    public _getPasses(): IFrameGraphPass[] {
        return this.disabled && this._passesDisabled.length > 0 ? this._passesDisabled : this._passes;
    }
}
