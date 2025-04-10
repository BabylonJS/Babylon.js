// eslint-disable-next-line import/no-internal-modules
import type { FrameGraph, FrameGraphObjectList, IFrameGraphPass, Nullable, FrameGraphTextureHandle, InternalTexture, FrameGraphRenderContext } from "core/index";
import { FrameGraphCullPass } from "./Passes/cullPass";
import { FrameGraphRenderPass } from "./Passes/renderPass";
import { Observable } from "core/Misc/observable";

/**
 * Represents a task in a frame graph.
 * @experimental
 */
export abstract class FrameGraphTask {
    protected readonly _frameGraph: FrameGraph;

    private readonly _passes: IFrameGraphPass[] = [];
    private readonly _passesDisabled: IFrameGraphPass[] = [];

    // Note: must be a getter/setter even if there's no specific processing, otherwise inherited classes can't make it a getter/setter!
    // Same thing for the disabled property
    protected _name: string;

    /**
     * The name of the task.
     */
    public get name() {
        return this._name;
    }

    public set name(value: string) {
        this._name = value;
    }

    protected _disabled = false;

    /**
     * Whether the task is disabled.
     */
    public get disabled() {
        return this._disabled;
    }

    public set disabled(value: boolean) {
        this._disabled = value;
    }

    /**
     * Gets the render passes of the task.
     */
    public get passes() {
        return this._passes;
    }

    /**
     * Gets the disabled render passes of the task.
     */
    public get passesDisabled() {
        return this._passesDisabled;
    }

    /**
     * The (texture) dependencies of the task (optional).
     */
    public dependencies?: Set<FrameGraphTextureHandle>;

    /**
     * Records the task in the frame graph. Use this function to add content (render passes, ...) to the task.
     */
    public abstract record(): void;

    /**
     * An observable that is triggered after the textures have been allocated.
     */
    public onTexturesAllocatedObservable: Observable<FrameGraphRenderContext> = new Observable();

    /**
     * Checks if the task is ready to be executed.
     * @returns True if the task is ready to be executed, else false.
     */
    public isReady(): boolean {
        return true;
    }

    /**
     * Disposes of the task.
     */
    public dispose() {
        this._reset();
        this.onTexturesAllocatedObservable.clear();
    }

    /**
     * Constructs a new frame graph task.
     * @param name The name of the task.
     * @param frameGraph The frame graph this task is associated with.
     */
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
        let outputTexture: Nullable<Nullable<InternalTexture>[]> = null;
        let outputDepthTexture: Nullable<InternalTexture> = null;
        let outputObjectList: FrameGraphObjectList | undefined;

        for (const pass of this._passes) {
            const errMsg = pass._isValid();
            if (errMsg) {
                throw new Error(`Pass "${pass.name}" is not valid. ${errMsg}`);
            }
            if (FrameGraphRenderPass.IsRenderPass(pass)) {
                const handles = Array.isArray(pass.renderTarget) ? pass.renderTarget : [pass.renderTarget];
                outputTexture = [];
                for (const handle of handles) {
                    if (handle !== undefined) {
                        outputTexture.push(this._frameGraph.textureManager.getTextureFromHandle(handle));
                    }
                }
                outputDepthTexture = pass.renderTargetDepth !== undefined ? this._frameGraph.textureManager.getTextureFromHandle(pass.renderTargetDepth) : null;
            } else if (FrameGraphCullPass.IsCullPass(pass)) {
                outputObjectList = pass.objectList;
            }
        }

        let disabledOutputTexture: Nullable<Nullable<InternalTexture>[]> = null;
        let disabledOutputTextureHandle: (FrameGraphTextureHandle | undefined)[] = [];
        let disabledOutputDepthTexture: Nullable<InternalTexture> = null;
        let disabledOutputObjectList: FrameGraphObjectList | undefined;

        for (const pass of this._passesDisabled) {
            const errMsg = pass._isValid();
            if (errMsg) {
                throw new Error(`Pass "${pass.name}" is not valid. ${errMsg}`);
            }
            if (FrameGraphRenderPass.IsRenderPass(pass)) {
                const handles = Array.isArray(pass.renderTarget) ? pass.renderTarget : [pass.renderTarget];
                disabledOutputTexture = [];
                for (const handle of handles) {
                    if (handle !== undefined) {
                        disabledOutputTexture.push(this._frameGraph.textureManager.getTextureFromHandle(handle));
                    }
                }
                disabledOutputTextureHandle = handles;
                disabledOutputDepthTexture = pass.renderTargetDepth !== undefined ? this._frameGraph.textureManager.getTextureFromHandle(pass.renderTargetDepth) : null;
            } else if (FrameGraphCullPass.IsCullPass(pass)) {
                disabledOutputObjectList = pass.objectList;
            }
        }

        if (this._passesDisabled.length > 0) {
            if (!this._checkSameRenderTarget(outputTexture, disabledOutputTexture)) {
                let ok = true;
                for (const handle of disabledOutputTextureHandle) {
                    if (handle !== undefined && !this._frameGraph.textureManager.isHistoryTexture(handle)) {
                        ok = false;
                        break;
                    }
                }
                if (!ok) {
                    throw new Error(`The output texture of the task "${this.name}" is different when it is enabled or disabled.`);
                }
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

    private _checkSameRenderTarget(src: Nullable<Nullable<InternalTexture>[]>, dst: Nullable<Nullable<InternalTexture>[]>) {
        if (src === null || dst === null) {
            return src === dst;
        }

        if (src.length !== dst.length) {
            return false;
        }

        for (let i = 0; i < src.length; i++) {
            if (src[i] !== dst[i]) {
                return false;
            }
        }

        return true;
    }
}
