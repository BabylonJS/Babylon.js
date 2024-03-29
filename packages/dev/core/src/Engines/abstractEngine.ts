import { Observable } from "../Misc/observable";
import { ThinEngine } from "./thinEngine";
import { Constants } from "./constants";
import type { Nullable } from "../types";
import type { PerfCounter } from "../Misc/perfCounter";
import type { OcclusionQuery } from "./Extensions/engine.query";
import type { PostProcess } from "../PostProcesses/postProcess";

/**
 * The parent class for specialized engines (WebGL, WebGPU)
 */
export abstract class AbstractEngine extends ThinEngine {
    protected _compatibilityMode = true;

    /**
     * Gets or sets the current render pass id
     */
    public currentRenderPassId = Constants.RENDERPASS_MAIN;

    /**
     * Gets a boolean indicating if the pointer is currently locked
     */
    public isPointerLock = false;

    /**
     * Gets the list of created postprocesses
     */
    public postProcesses: PostProcess[] = [];

    /** Gets or sets the tab index to set to the rendering canvas. 1 is the minimum value to set to be able to capture keyboard events */
    public canvasTabIndex = 1;

    /**
     * Observable event triggered each time the canvas loses focus
     */
    public onCanvasBlurObservable = new Observable<AbstractEngine>();

    protected _onPointerLockChange: () => void;

    /** @internal */
    public _verifyPointerLock(): void {
        this._onPointerLockChange?.();
    }
    /**
     * Gets the HTML element used to attach event listeners
     * @returns a HTML element
     */
    public getInputElement(): Nullable<HTMLElement> {
        return this._renderingCanvas;
    }

    /**
     * Gets the client rect of the HTML canvas attached with the current webGL context
     * @returns a client rectangle
     */
    public getRenderingCanvasClientRect(): Nullable<ClientRect> {
        if (!this._renderingCanvas) {
            return null;
        }
        return this._renderingCanvas.getBoundingClientRect();
    }

    /**
     * Gets the client rect of the HTML element used for events
     * @returns a client rectangle
     */
    public getInputElementClientRect(): Nullable<ClientRect> {
        if (!this._renderingCanvas) {
            return null;
        }
        return this.getInputElement()!.getBoundingClientRect();
    }

    /**
     * (WebGPU only) True (default) to be in compatibility mode, meaning rendering all existing scenes without artifacts (same rendering than WebGL).
     * Setting the property to false will improve performances but may not work in some scenes if some precautions are not taken.
     * See https://doc.babylonjs.com/setup/support/webGPU/webGPUOptimization/webGPUNonCompatibilityMode for more details
     */
    public get compatibilityMode() {
        return this._compatibilityMode;
    }

    public set compatibilityMode(mode: boolean) {
        // not supported in WebGL
        this._compatibilityMode = true;
    }
    /**
     * Gets the current depth function
     * @returns a number defining the depth function
     */
    public getDepthFunction(): Nullable<number> {
        return this._depthCullingState.depthFunc;
    }

    /**
     * Sets the current depth function
     * @param depthFunc defines the function to use
     */
    public setDepthFunction(depthFunc: number) {
        this._depthCullingState.depthFunc = depthFunc;
    }

    /**
     * Sets the current depth function to GREATER
     */
    public setDepthFunctionToGreater(): void {
        this.setDepthFunction(Constants.GREATER);
    }

    /**
     * Sets the current depth function to GEQUAL
     */
    public setDepthFunctionToGreaterOrEqual(): void {
        this.setDepthFunction(Constants.GEQUAL);
    }

    /**
     * Sets the current depth function to LESS
     */
    public setDepthFunctionToLess(): void {
        this.setDepthFunction(Constants.LESS);
    }

    /**
     * Sets the current depth function to LEQUAL
     */
    public setDepthFunctionToLessOrEqual(): void {
        this.setDepthFunction(Constants.LEQUAL);
    }

    /**
     * Gets a boolean indicating if depth writing is enabled
     * @returns the current depth writing state
     */
    public getDepthWrite(): boolean {
        return this._depthCullingState.depthMask;
    }

    /**
     * Enable or disable depth writing
     * @param enable defines the state to set
     */
    public setDepthWrite(enable: boolean): void {
        this._depthCullingState.depthMask = enable;
    }

    /**
     * Observable raised when the engine is about to compile a shader
     */
    public onBeforeShaderCompilationObservable = new Observable<AbstractEngine>();

    /**
     * Observable raised when the engine has just compiled a shader
     */
    public onAfterShaderCompilationObservable = new Observable<AbstractEngine>();

    /**
     * Observable raised when the engine begins a new frame
     */
    public onBeginFrameObservable = new Observable<AbstractEngine>();

    /**
     * Observable raised when the engine ends the current frame
     */
    public onEndFrameObservable = new Observable<AbstractEngine>();

    /**
     * Get the performance counter associated with the frame time computation
     * @returns the perf counter
     */
    public getGPUFrameTimeCounter(): Nullable<PerfCounter> {
        return null;
    }

    /**
     * Enable or disable the GPU frame time capture
     * @param value True to enable, false to disable
     */
    public captureGPUFrameTime(value: boolean): void {
        // Do nothing. Must be implemented by child classes
    }

    /**
     * Create a new webGL query (you must be sure that queries are supported by checking getCaps() function)
     * @returns the new query
     */
    public createQuery(): Nullable<OcclusionQuery> {
        return null;
    }

    /**
     * Delete and release a webGL query
     * @param query defines the query to delete
     * @returns the current engine
     */
    public deleteQuery(query: OcclusionQuery): AbstractEngine {
        // Do nothing. Must be implemented by child classes
        return this;
    }

    /**
     * Check if a given query has resolved and got its value
     * @param query defines the query to check
     * @returns true if the query got its value
     */
    public isQueryResultAvailable(query: OcclusionQuery): boolean {
        // Do nothing. Must be implemented by child classes
        return false;
    }

    /**
     * Gets the value of a given query
     * @param query defines the query to check
     * @returns the value of the query
     */
    public getQueryResult(query: OcclusionQuery): number {
        // Do nothing. Must be implemented by child classes
        return 0;
    }

    /**
     * Initiates an occlusion query
     * @param algorithmType defines the algorithm to use
     * @param query defines the query to use
     * @returns the current engine
     * @see https://doc.babylonjs.com/features/featuresDeepDive/occlusionQueries
     */
    public beginOcclusionQuery(algorithmType: number, query: OcclusionQuery): boolean {
        // Do nothing. Must be implemented by child classes
        return false;
    }

    /**
     * Ends an occlusion query
     * @see https://doc.babylonjs.com/features/featuresDeepDive/occlusionQueries
     * @param algorithmType defines the algorithm to use
     * @returns the current engine
     */
    public endOcclusionQuery(algorithmType: number): AbstractEngine {
        // Do nothing. Must be implemented by child classes
        return this;
    }
}
