import {
    getMaterialSource,
    getRenderingContextKind,
    getRenderingContexts,
    getRenderTaskGpuTimings,
    setRenderTaskGpuTimingEnabled,
    type EngineContext,
    type Material,
    type RenderTaskGpuTimings,
    type SceneContext,
    type SpriteRenderer,
    type TextRenderer,
} from "@babylonjs/lite";

import { Logger } from "core/Misc/logger";
import { Observable } from "core/Misc/observable";
import { GetMaterialTopologyBindings } from "./services/panes/scene/materialTopologyBindings";

/**
 * Counts distinct entities reachable through registered rendering contexts.
 * @param engine The inspected engine.
 * @returns Engine-wide counts, deduplicated by entity identity.
 * @internal
 */
export function GetLiteCounts(engine: EngineContext) {
    const contexts = new Set(engine.surfaces.flatMap((surface) => getRenderingContexts(surface)));
    const meshes = new Set<object>();
    const lights = new Set<object>();
    const materials = new Set<Material>();
    const materialBindings = new Set<Material>();
    const textures = new Set<object>();
    const animationGroups = new Set<object>();
    const shadowGenerators = new Set<object>();
    const textLayers = new Set<object>();
    const spriteLayers = new Set<object>();
    let scenes = 0;

    for (const context of contexts) {
        switch (getRenderingContextKind(context)) {
            case "scene": {
                scenes++;
                const scene = context as SceneContext;
                for (const mesh of scene.meshes) {
                    meshes.add(mesh);
                    const source = getMaterialSource(mesh.material);
                    materials.add(source);
                    materialBindings.add(source);
                    materialBindings.add(mesh.material);
                }
                scene.lights.forEach((light) => lights.add(light));
                scene.animationGroups.forEach((group) => animationGroups.add(group));
                scene.shadowGenerators.forEach((generator) => shadowGenerators.add(generator));
                break;
            }
            case "text-renderer":
                (context as TextRenderer).layers.forEach((layer) => textLayers.add(layer));
                break;
            case "sprite-renderer":
                (context as SpriteRenderer).layers.forEach((layer) => spriteLayers.add(layer));
                break;
        }
    }

    for (const material of materialBindings) {
        GetMaterialTopologyBindings(material).forEach((binding) => textures.add(binding.entity));
    }

    return {
        surfaces: engine.surfaces.length,
        contexts: contexts.size,
        scenes,
        meshes: meshes.size,
        lights: lights.size,
        materials: materials.size,
        textures: textures.size,
        animationGroups: animationGroups.size,
        shadowGenerators: shadowGenerators.size,
        textLayers: textLayers.size,
        spriteLayers: spriteLayers.size,
    };
}

/** One sampled GPU readback, not a record of every rendered frame. @internal */
export type GpuTimingSample = Readonly<{
    /** Wall-clock time since this profiling session began, in milliseconds. */
    elapsedMs: number;
    /** Frame index of the asynchronous GPU readback. */
    frameIndex: number;
    /** Span from the first measured task start to the last task end, in milliseconds. */
    durationMs: number;
    /** Latest engine draw count, which may come from a different frame. */
    latestDrawCalls: number;
}>;

/** Retains a bounded, session-owned GPU history and releases only profiling enabled by Inspector. @internal */
export class LiteStatistics {
    /** Notifies when timing state or the sampled history changes. */
    public readonly onChanged = new Observable<void>();
    /** Whether profiling was already enabled when Inspector opened. */
    public readonly applicationOwnsTiming: boolean;
    /** The latest public GPU timing snapshot. */
    public timing: RenderTaskGpuTimings;
    /** Whether an asynchronous profiling toggle is in progress. */
    public busy = false;
    /** A profiling lifecycle failure, if any. */
    public error: string | undefined;
    /** Latest 120 distinct GPU readbacks sampled by Inspector. */
    public readonly samples: GpuTimingSample[] = [];

    private readonly _interval: ReturnType<typeof setInterval>;
    private _ownsTiming = false;
    private _disposed = false;
    private _startedAt = performance.now();
    private _lastFrameIndex = 0;

    public constructor(private readonly _engine: EngineContext) {
        this.timing = getRenderTaskGpuTimings(_engine);
        this.applicationOwnsTiming = this.timing.enabled;
        this._interval = setInterval(() => this._refresh(), 250);
    }

    /**
     * Toggles Inspector-owned profiling without modifying application-owned profiling.
     * @param enabled Whether to collect future GPU task timings.
     */
    public async setEnabledAsync(enabled: boolean): Promise<void> {
        if (this._disposed || this.busy) {
            return;
        }
        if (this.applicationOwnsTiming) {
            throw new Error("GPU task timing is managed by the application.");
        }

        this.busy = true;
        this.error = undefined;
        if (enabled) {
            this._ownsTiming = true;
            this.samples.length = 0;
            this._lastFrameIndex = 0;
            this._startedAt = performance.now();
        }
        this.onChanged.notifyObservers();
        try {
            await setRenderTaskGpuTimingEnabled(this._engine, enabled);
            if (!enabled) {
                this._ownsTiming = false;
            }
        } catch (error) {
            this.error = `Unable to ${enabled ? "enable" : "disable"} GPU task timing: ${error instanceof Error ? error.message : String(error)}`;
            Logger.Error(this.error);
            if (enabled) {
                await this._disableOwnedTimingAsync();
            }
        } finally {
            this.busy = false;
            if (!this._disposed) {
                this._refresh();
                this.onChanged.notifyObservers();
            }
        }
    }

    /**
     * Exports the retained readbacks and latest draw counts.
     * @returns CSV text with numeric columns and a header row.
     */
    public toCsv(): string {
        const rows = ["sampleTimeMs,gpuFrameIndex,gpuTaskSpanMs,latestDrawCalls"];
        for (const sample of this.samples) {
            rows.push(`${sample.elapsedMs},${sample.frameIndex},${sample.durationMs},${sample.latestDrawCalls}`);
        }
        return rows.join("\n");
    }

    /** Stops polling and disables only profiling owned by Inspector. */
    public dispose(): void {
        if (this._disposed) {
            return;
        }
        this._disposed = true;
        clearInterval(this._interval);
        this.onChanged.clear();
        void this._disableOwnedTimingAsync();
    }

    private async _disableOwnedTimingAsync(): Promise<void> {
        if (this._ownsTiming) {
            try {
                await setRenderTaskGpuTimingEnabled(this._engine, false);
                this._ownsTiming = false;
            } catch (error) {
                this.error = `Unable to disable GPU task timing: ${error instanceof Error ? error.message : String(error)}`;
                Logger.Error(this.error);
            }
        }
    }

    private _refresh(): void {
        const timing = getRenderTaskGpuTimings(this._engine);
        const changed = timing !== this.timing;
        this.timing = timing;
        let sampled = false;
        if (timing.enabled && timing.status === "available" && timing.frameIndex !== this._lastFrameIndex) {
            this._lastFrameIndex = timing.frameIndex;
            this.samples.push({
                elapsedMs: performance.now() - this._startedAt,
                frameIndex: timing.frameIndex,
                durationMs: timing.totalDurationMs,
                latestDrawCalls: this._engine.drawCallCount,
            });
            if (this.samples.length > 120) {
                this.samples.shift();
            }
            sampled = true;
        }
        if (changed || sampled) {
            this.onChanged.notifyObservers();
        }
    }
}
