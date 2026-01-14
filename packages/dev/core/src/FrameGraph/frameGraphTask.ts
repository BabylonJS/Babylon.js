import type { FrameGraph, FrameGraphObjectList, IFrameGraphPass, Nullable, FrameGraphTextureHandle, InternalTexture, FrameGraphRenderContext } from "core/index";
import { FrameGraphObjectListPass } from "./Passes/objectListPass";
import { FrameGraphRenderPass } from "./Passes/renderPass";
import { Observable } from "core/Misc/observable";

/**
 * Represents a task in a frame graph.
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
     * Gets the passes of the task.
     */
    public get passes() {
        return this._passes;
    }

    /**
     * Gets the disabled passes of the task.
     */
    public get passesDisabled() {
        return this._passesDisabled;
    }

    /**
     * The (texture) dependencies of the task (optional).
     */
    public dependencies?: Set<FrameGraphTextureHandle>;

    /** @internal */
    public _disableDebugMarkers = false;

    /**
     * Records the task in the frame graph. Use this function to add content (render passes, ...) to the task.
     * @param skipCreationOfDisabledPasses If true, the disabled passe(s) won't be created.
     */
    public abstract record(skipCreationOfDisabledPasses?: boolean): void;

    /**
     * Gets the current class name
     * @returns the class name
     */
    public getClassName(): string {
        return "FrameGraphTask";
    }

    /**
     * This function is called once after the task has been added to the frame graph and before the frame graph is built for the first time.
     * This allows you to initialize asynchronous resources, which is not possible in the constructor.
     * @returns A promise that resolves when the initialization is complete.
     */
    // eslint-disable-next-line @typescript-eslint/promise-function-async, no-restricted-syntax
    public initAsync(): Promise<unknown> {
        return Promise.resolve();
    }

    /**
     * An observable that is triggered after the textures have been allocated.
     */
    public onTexturesAllocatedObservable: Observable<FrameGraphRenderContext> = new Observable();

    /**
     * An observable that is triggered before the task is executed.
     */
    public onBeforeTaskExecute: Observable<FrameGraphTask> = new Observable();

    /**
     * An observable that is triggered after the task is executed.
     */
    public onAfterTaskExecute: Observable<FrameGraphTask> = new Observable();

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
        this.onBeforeTaskExecute.clear();
        this.onAfterTaskExecute.clear();
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
        for (const pass of this._passes) {
            pass._dispose();
        }
        for (const pass of this._passesDisabled) {
            pass._dispose();
        }
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
            } else if (FrameGraphObjectListPass.IsObjectListPass(pass)) {
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
            } else if (FrameGraphObjectListPass.IsObjectListPass(pass)) {
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
            if (outputDepthTexture !== disabledOutputDepthTexture && disabledOutputDepthTexture !== null) {
                throw new Error(`The output depth texture of the task "${this.name}" is different when it is enabled or disabled.`);
            }
            if (outputObjectList !== disabledOutputObjectList && disabledOutputObjectList !== null) {
                throw new Error(`The output object list of the task "${this.name}" is different when it is enabled or disabled.`);
            }
        }
    }

    /** @internal */
    public _execute() {
        const passes = this._disabled && this._passesDisabled.length > 0 ? this._passesDisabled : this._passes;

        this.onBeforeTaskExecute.notifyObservers(this);

        if (!this._disableDebugMarkers) {
            this._frameGraph.engine._debugPushGroup?.(`${this.getClassName()} (${this.name})`);
        }

        for (const pass of passes) {
            pass._execute();
        }

        if (!this._disableDebugMarkers) {
            this._frameGraph.engine._debugPopGroup?.();
        }

        this.onAfterTaskExecute.notifyObservers(this);
    }

    /** @internal */
    public _initializePasses() {
        if (!this._disableDebugMarkers) {
            this._frameGraph.engine._debugPushGroup?.(`${this.getClassName()} (${this.name})`);
        }

        for (const pass of this._passes) {
            pass._initialize();
        }

        for (const pass of this._passesDisabled) {
            pass._initialize();
        }

        if (!this._disableDebugMarkers) {
            this._frameGraph.engine._debugPopGroup?.();
        }
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
