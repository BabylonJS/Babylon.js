import { Observable } from "@babylonjs/core/Misc/observable.js";
import type { ThinEngine } from "@babylonjs/core/Engines/thinEngine";
import type { Nullable } from "@babylonjs/core/types";
import {
    ConnectionPointType,
    SmartFilterOptimizer,
    type InputBlock,
    type SmartFilter,
    type SmartFilterRuntime,
    Logger,
} from "@babylonjs/smart-filters";
import { RenderTargetGenerator } from "@babylonjs/smart-filters";
import { LogEntry, registerAnimations, TextureAssetCache } from "@babylonjs/smart-filters-editor-control";

/**
 * Describes the result of rendering a Smart Filter
 */
export type RenderResult = {
    /**
     * Indicates if the Smart Filter was rendered successfully
     */
    succeeded: boolean;

    /**
     * The time it took to optimize the Smart Filter (null if not applicable)
     */
    optimizationTimeMs: Nullable<number>;

    /**
     * The time it took to compile the Smart Filter (null if not applicable)
     */
    runtimeCreationTimeMs: Nullable<number>;
};

/**
 * Simple example of rendering a Smart Filter
 */
export class SmartFilterRenderer {
    private _animationDisposeWork: Nullable<() => void> = null;
    private _textureAssetCache: TextureAssetCache;
    private _lastRenderedSmartFilter: Nullable<SmartFilter> = null;

    /**
     * Callback called before rendering the filter every frame.
     */
    public readonly beforeRenderObservable: Observable<void>;

    /**
     * Callback called after rendering the filter every frame.
     */
    public readonly afterRenderObservable: Observable<void>;

    /**
     * The engine used to render the filter.
     */
    public readonly engine: ThinEngine;

    /**
     * The current runtime to render the filter.
     */
    public runtime: Nullable<SmartFilterRuntime> = null;

    /**
     * If true, Smart Filters rendered with this renderer will be optimized.
     * Does not affect any previously rendered filters.
     */
    public optimize: boolean = false;

    /**
     * Creates a new Smart Filter renderer.
     * @param engine - the engine to use to render the filter
     * @param optimize - if true, Smart Filters rendered with this renderer will be optimized
     */
    public constructor(engine: ThinEngine, optimize: boolean) {
        this.engine = engine;
        this.beforeRenderObservable = new Observable<void>();
        this.afterRenderObservable = new Observable<void>();

        this.engine.depthCullingState.depthTest = false;
        this.engine.stencilState.stencilTest = false;

        this._textureAssetCache = new TextureAssetCache(engine, this.beforeRenderObservable);

        this.optimize = optimize;
    }

    /**
     * Starts rendering the filter. (won't stop until dispose is called)
     * @param filter - The Smart Filter to render
     * @param onLogRequiredObservable - The observable to use to notify when a log entry is required
     * @returns A promise that resolves as true if the rendering started successfully, false otherwise
     */
    public async startRendering(
        filter: SmartFilter,
        onLogRequiredObservable: Observable<LogEntry>
    ): Promise<RenderResult> {
        let optimizationTimeMs: Nullable<number> = null;
        let runtimeCreationTimeMs: Nullable<number> = null;

        try {
            this._lastRenderedSmartFilter = filter;
            const filterToRender = filter;
            if (this.optimize) {
                const optimizeStartTime = performance.now();
                this._optimize(filter);
                optimizationTimeMs = performance.now() - optimizeStartTime;
            }

            const rtg = new RenderTargetGenerator(this.optimize);

            const createRuntimeStartTime = performance.now();
            const runtime = await filterToRender.createRuntimeAsync(this.engine, rtg);
            runtimeCreationTimeMs = performance.now() - createRuntimeStartTime;

            // NOTE: Always load assets and animations from the unoptimized filter because it has all the metadata needed to load assets and
            //       shares runtime data with the optimized filter so loading assets for it will work for the optimized filter as well
            await this.loadAssets(filter);
            this._loadAnimations(filter);

            Logger.Log("Number of render targets created: " + rtg.numTargetsCreated);

            this._setRuntime(runtime);

            return {
                succeeded: true,
                optimizationTimeMs,
                runtimeCreationTimeMs,
            };
        } catch (err: any) {
            const message = err["message"] || err["_compilationError"] || err;
            onLogRequiredObservable.notifyObservers(new LogEntry(`Could not render Smart Filter:\n${message}`, true));
            return {
                succeeded: false,
                optimizationTimeMs: null,
                runtimeCreationTimeMs: null,
            };
        }
    }

    /**
     * If the Smart Filter had any assets, such as images or videos for input texture blocks,
     * and the necessary information to rehydrate them is present in the editor data, load
     * those assets now.
     * @param smartFilter - The Smart Filter to load assets for
     */
    public async loadAssets(smartFilter: SmartFilter): Promise<void> {
        const inputBlocks: InputBlock<ConnectionPointType.Texture>[] = [];

        // Gather all the texture input blocks from the graph
        for (const block of smartFilter.attachedBlocks) {
            if (block.getClassName() === "InputBlock" && (block as any).type === ConnectionPointType.Texture) {
                inputBlocks.push(block as InputBlock<ConnectionPointType.Texture>);
            }
        }

        // Load the assets for the input blocks
        await this._textureAssetCache.loadAssetsForInputBlocks(inputBlocks);
    }

    /**
     * Reloads the assets for the most recently rendered Smart Filter.
     * @returns A promise that resolves when the assets are loaded
     */
    public reloadAssets(): Promise<void> {
        if (!this._lastRenderedSmartFilter) {
            throw new Error("No Smart Filter has been rendered yet");
        }
        return this.loadAssets(this._lastRenderedSmartFilter);
    }

    /**
     * Disposes the renderer and stops rendering.
     */
    public dispose(): void {
        this.engine.stopRenderLoop();
        this.beforeRenderObservable.clear();
        this.afterRenderObservable.clear();

        if (this.runtime) {
            this.runtime.dispose();
            this.runtime = null;
        }

        if (this._animationDisposeWork) {
            this._animationDisposeWork();
            this._animationDisposeWork = null;
        }

        this._textureAssetCache.dispose();
    }

    /**
     * Sets the runtime to render.
     * @param runtime - The runtime to render
     */
    private _setRuntime(runtime: SmartFilterRuntime) {
        this.engine.stopRenderLoop();

        // Dispose the previous runtime.
        if (this.runtime) {
            this.runtime.dispose();
        }

        this.engine.runRenderLoop(() => {
            this.beforeRenderObservable.notifyObservers();

            runtime.render();

            this.afterRenderObservable.notifyObservers();
        });

        this.runtime = runtime;
    }

    private _loadAnimations(smartFilter: SmartFilter): void {
        if (this._animationDisposeWork) {
            this._animationDisposeWork();
        }

        this._animationDisposeWork = registerAnimations(smartFilter, this.engine, this.beforeRenderObservable);
    }

    private _optimize(smartFilter: SmartFilter): SmartFilter {
        const forceMaxSamplersInFragmentShader = 0;

        const optimizer = new SmartFilterOptimizer(smartFilter, {
            maxSamplersInFragmentShader:
                forceMaxSamplersInFragmentShader || this.engine.getCaps().maxTexturesImageUnits,
            removeDisabledBlocks: false, // False so that we don't have to rerender the graph if uniforms change in the editor
        });

        const optimizedSmartFilter = optimizer.optimize();

        if (optimizedSmartFilter === null) {
            throw new Error("Failed to optimize Smart Filter");
        }
        return optimizedSmartFilter;
    }
}
