import { PerformanceViewerCollector } from "core/Misc/PerformanceViewer/performanceViewerCollector";
import { DefaultPerfStrategies } from "../../misc/defaultPerfStrategies";
import { type ServiceDefinition } from "shared-ui-components/modularTool/modularity/serviceDefinition";
import { type ISceneContext, SceneContextIdentity } from "../sceneContext";
import { type IInspectableCommandRegistry, InspectableCommandRegistryIdentity } from "./inspectableCommandRegistry";

import "core/Misc/PerformanceViewer/performanceViewerSceneExtension";

/**
 * Service that registers CLI commands for performance tracing using the PerformanceViewerCollector.
 * start-perf-trace begins collecting data, stop-perf-trace stops and returns the collected data as JSON.
 */
export const PerfTraceCommandServiceDefinition: ServiceDefinition<[], [IInspectableCommandRegistry, ISceneContext]> = {
    friendlyName: "Perf Trace Command Service",
    consumes: [InspectableCommandRegistryIdentity, SceneContextIdentity],
    factory: (commandRegistry, sceneContext) => {
        let perfCollector: PerformanceViewerCollector | undefined;

        const startReg = commandRegistry.addCommand({
            id: "start-perf-trace",
            description: "Start collecting performance trace data.",
            executeAsync: async () => {
                const scene = sceneContext.currentScene;
                if (!scene) {
                    throw new Error("No active scene.");
                }

                if (perfCollector?.isStarted) {
                    return "Performance trace is already running.";
                }

                perfCollector = scene.getPerfCollector();
                perfCollector.stop();
                perfCollector.clear(false);
                perfCollector.addCollectionStrategies(...DefaultPerfStrategies);
                perfCollector.start(true);

                return "Performance trace started.";
            },
        });

        const stopReg = commandRegistry.addCommand({
            id: "stop-perf-trace",
            description: "Stop collecting performance trace data and return the results as JSON.",
            executeAsync: async () => {
                if (!perfCollector || !perfCollector.isStarted) {
                    throw new Error("Performance trace is not running. Run start-perf-trace first.");
                }

                perfCollector.stop();

                const datasets = perfCollector.datasets;
                const ids = datasets.ids;
                const rawData = datasets.data.subarray(0, datasets.data.itemLength);
                const sliceSize = ids.length + PerformanceViewerCollector.SliceDataOffset;

                const samples: Record<string, unknown>[] = [];
                for (let i = 0; i < rawData.length; i += sliceSize) {
                    const timestamp = rawData[i];
                    const sample: Record<string, unknown> = { timestamp };
                    for (let j = 0; j < ids.length; j++) {
                        sample[ids[j]] = rawData[i + PerformanceViewerCollector.SliceDataOffset + j];
                    }
                    samples.push(sample);
                }

                perfCollector.clear(false);
                perfCollector = undefined;

                return JSON.stringify({ strategies: ids, sampleCount: samples.length, samples }, null, 2);
            },
        });

        return {
            dispose: () => {
                startReg.dispose();
                stopReg.dispose();
                if (perfCollector?.isStarted) {
                    perfCollector.stop();
                }
                perfCollector = undefined;
            },
        };
    },
};
