import { ArrowEnterUpRegular, CatchUpRegular, HeadphonesSoundWaveRegular, SoundWaveCircleFilled, SoundWaveCircleRegular } from "@fluentui/react-icons";
import { type FunctionComponent } from "react";

import { Logger } from "core/Misc/logger";
import { Observable } from "core/Misc/observable";
import { type ServiceDefinition } from "shared-ui-components/modularTool/modularity/serviceDefinition";

import { GetEntityId, type ExplorerNodeDescription } from "../components/explorer/explorerModel";
import { type IWatcherService, WatcherServiceIdentity } from "../services/watcherService";
import { AudioEngineContextIdentity, type IAudioEngineContext } from "./audioEngineContext";
import { GetLiteAudioEntryName, GetLiteAudioGraph, type LiteAudioGraph, type LiteAudioGraphEntry } from "./audioEngineGraph";
import { EngineExplorerServiceIdentity, type IEngineExplorerService } from "./engineExplorerService";
import { CreateWatchedNameDisplayInfo } from "./explorerDisplayInfo";

const AudioEngineIcon: FunctionComponent = () => <HeadphonesSoundWaveRegular />;
const AudioBusIcon: FunctionComponent = () => <ArrowEnterUpRegular />;
const StaticSoundIcon: FunctionComponent = () => <SoundWaveCircleRegular />;
const StreamingSoundIcon: FunctionComponent = () => <SoundWaveCircleFilled />;
const AudioSourceIcon: FunctionComponent = () => <CatchUpRegular />;

function CreateAudioNodes(graph: LiteAudioGraph, watcherService: IWatcherService): readonly ExplorerNodeDescription[] {
    const busEntries = graph.entries.filter((entry) => entry.kind === "main-bus" || entry.kind === "bus");
    const children = new Map<object, LiteAudioGraphEntry[]>();
    const roots: LiteAudioGraphEntry[] = [];

    for (const entry of graph.entries) {
        if (entry.kind !== "main-bus" && entry.output && busEntries.some((bus) => bus.entity === entry.output)) {
            const siblings = children.get(entry.output) ?? [];
            siblings.push(entry);
            children.set(entry.output, siblings);
        } else {
            roots.push(entry);
        }
    }

    const reached = new Set<object>();
    const markReached = (entry: LiteAudioGraphEntry) => {
        if (reached.has(entry.entity)) {
            return;
        }
        reached.add(entry.entity);
        children.get(entry.entity)?.forEach(markReached);
    };
    roots.forEach(markReached);
    for (const entry of graph.entries) {
        if (!reached.has(entry.entity)) {
            roots.push(entry);
            markReached(entry);
        }
    }

    const createNode = (entry: LiteAudioGraphEntry, ancestors: ReadonlySet<object>): ExplorerNodeDescription => {
        const nextAncestors = new Set(ancestors).add(entry.entity);
        const icon =
            entry.kind === "main-bus" || entry.kind === "bus"
                ? AudioBusIcon
                : entry.kind === "static-sound"
                  ? StaticSoundIcon
                  : entry.kind === "streaming-sound"
                    ? StreamingSoundIcon
                    : AudioSourceIcon;
        return {
            id: GetEntityId(entry.entity).toString(),
            kind: "item",
            entity: entry.entity,
            icon,
            getDisplayInfo: () => CreateWatchedNameDisplayInfo(watcherService, entry.entity, () => GetLiteAudioEntryName(graph, entry)),
            getChildren: () => (children.get(entry.entity) ?? []).filter((child) => !nextAncestors.has(child.entity)).map((child) => createNode(child, nextAncestors)),
        };
    };
    return roots.map((entry) => createNode(entry, new Set()));
}

/**
 * Adds the attached Babylon Lite audio engine and its routed nodes as an independent Explorer root.
 */
export const AudioEngineExplorerServiceDefinition: ServiceDefinition<[], [IEngineExplorerService, IAudioEngineContext, IWatcherService]> = {
    friendlyName: "Babylon Lite Audio Engine Explorer",
    consumes: [EngineExplorerServiceIdentity, AudioEngineContextIdentity, WatcherServiceIdentity],
    factory: (explorerRootService, audioEngineContext, watcherService) => {
        const changed = new Observable<void>();
        let warnedEngine: object | null = null;
        const getGraph = () => {
            const engine = audioEngineContext.audioEngine;
            if (!engine) {
                return null;
            }
            const graph = GetLiteAudioGraph(engine);
            if (!graph && warnedEngine !== engine) {
                Logger.Warn("Babylon Lite audio graph inspection is unavailable: the audio engine layout is unsupported.");
                warnedEngine = engine;
            }
            return graph;
        };
        const getTopology = (): readonly (object | string | null)[] => {
            const engine = audioEngineContext.audioEngine;
            if (!engine) {
                return [];
            }
            const graph = getGraph();
            return graph ? [engine, ...graph.entries.flatMap((entry) => [entry.kind, entry.entity, entry.output])] : [engine];
        };
        const topologyWatcher = watcherService.watchValue(
            getTopology,
            () => changed.notifyObservers(),
            (left, right) => left.length === right.length && left.every((value, index) => value === right[index])
        );
        const contextObserver = audioEngineContext.onAudioEngineChanged.add(() => changed.notifyObservers());
        const rootProvider = explorerRootService.addRootProvider({
            getRoots: () => {
                const audioEngine = audioEngineContext.audioEngine;
                const graph = getGraph();
                return audioEngine
                    ? [
                          {
                              id: "audio-engine",
                              entity: audioEngine,
                              label: graph ? "Audio Engine" : "Audio Engine (unsupported audio graph)",
                              icon: AudioEngineIcon,
                              getNodes: () => (graph ? CreateAudioNodes(graph, watcherService) : []),
                          },
                      ]
                    : [];
            },
            onChanged: changed,
        });

        return {
            dispose: () => {
                contextObserver.remove(true);
                topologyWatcher.dispose();
                rootProvider.dispose();
                changed.clear();
            },
        };
    },
};
