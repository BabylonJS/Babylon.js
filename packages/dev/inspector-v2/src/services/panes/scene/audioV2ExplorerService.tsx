import { type AbstractNamedAudioNode, type AudioEngineV2, type IDisposable } from "core/index";
import { type ServiceDefinition } from "shared-ui-components/modularTool/modularity/serviceDefinition";
import { type ISceneExplorerService, SceneExplorerServiceIdentity } from "./sceneExplorerService";

import { tokens } from "@fluentui/react-components";
import { ArrowEnterUpRegular, CatchUpRegular, HeadphonesSoundWaveRegular, SoundWaveCircleFilled, SoundWaveCircleRegular } from "@fluentui/react-icons";

import { AbstractAudioBus } from "core/AudioV2/abstractAudio/abstractAudioBus";
import { AbstractSoundSource } from "core/AudioV2/abstractAudio/abstractSoundSource";
import { AudioBus } from "core/AudioV2/abstractAudio/audioBus";
import { AudioEngineV2 as AudioEngineV2Class, LastCreatedAudioEngine, OnAudioEngineV2CreatedObservable } from "core/AudioV2/abstractAudio/audioEngineV2";
import { MainAudioBus } from "core/AudioV2/abstractAudio/mainAudioBus";
import { StaticSound } from "core/AudioV2/abstractAudio/staticSound";
import { StreamingSound } from "core/AudioV2/abstractAudio/streamingSound";
import { Observable } from "core/Misc/observable";
import { InterceptProperty } from "../../../instrumentation/propertyInstrumentation";
import { DefaultSectionsOrder } from "./defaultSectionsMetadata";

type AudioV2Entity = AudioEngineV2 | AbstractNamedAudioNode;

function IsRoutable(node: AbstractNamedAudioNode): node is AbstractSoundSource | AudioBus {
    return node instanceof AbstractSoundSource || node instanceof AudioBus;
}

function GetEngineDisplayName(engine: AudioEngineV2): string {
    return LastCreatedAudioEngine() === engine ? "Last Created Audio Engine" : "Other Audio Engine";
}

export const AudioV2ExplorerServiceDefinition: ServiceDefinition<[], [ISceneExplorerService]> = {
    friendlyName: "Audio V2 Explorer",
    consumes: [SceneExplorerServiceIdentity],
    factory: (sceneExplorerService) => {
        // Section-level observables driven by per-engine subscriptions below.
        const entityAddedObservable = new Observable<AudioV2Entity>();
        const entityRemovedObservable = new Observable<AudioV2Entity>();
        const entityMovedObservable = new Observable<AudioV2Entity>();

        // Notified whenever any engine's "Last Created" status may have changed (i.e. an engine
        // was added or removed). Display info hooks subscribe to this to refresh the engine label.
        const engineDisplayNameChangedObservable = new Observable<void>();

        // Per-engine subscription tokens (disposed when the engine is disposed).
        const engineSubscriptions = new Map<AudioEngineV2, IDisposable>();

        // Per-instance outBus interception tokens for sounds / sound sources / audio buses.
        const outBusInterceptors = new Map<AbstractSoundSource | AudioBus, IDisposable>();

        const subscribeOutBus = (entity: AbstractSoundSource | AudioBus) => {
            if (outBusInterceptors.has(entity)) {
                return;
            }
            outBusInterceptors.set(
                entity,
                InterceptProperty(entity, "outBus", {
                    afterSet: () => entityMovedObservable.notifyObservers(entity),
                })
            );
        };

        const unsubscribeOutBus = (entity: AbstractSoundSource | AudioBus) => {
            outBusInterceptors.get(entity)?.dispose();
            outBusInterceptors.delete(entity);
        };

        const subscribeEngine = (engine: AudioEngineV2) => {
            if (engineSubscriptions.has(engine)) {
                return;
            }

            const nodeAddedObserver = engine.onNodeAddedObservable.add((node) => {
                if (IsRoutable(node)) {
                    subscribeOutBus(node);
                }
                entityAddedObservable.notifyObservers(node);
            });

            const nodeRemovedObserver = engine.onNodeRemovedObservable.add((node) => {
                if (IsRoutable(node)) {
                    unsubscribeOutBus(node);
                }
                entityRemovedObservable.notifyObservers(node);
            });

            const disposeObserver = engine.onDisposeObservable.add(() => {
                unsubscribeEngine(engine);
                entityRemovedObservable.notifyObservers(engine);
                engineDisplayNameChangedObservable.notifyObservers();
            });

            // Seed outBus interception for nodes that already exist on this engine.
            for (const node of engine.nodes) {
                if (IsRoutable(node)) {
                    subscribeOutBus(node);
                }
            }

            engineSubscriptions.set(engine, {
                dispose: () => {
                    nodeAddedObserver.remove();
                    nodeRemovedObserver.remove();
                    disposeObserver.remove();
                },
            });
        };

        const unsubscribeEngine = (engine: AudioEngineV2) => {
            engineSubscriptions.get(engine)?.dispose();
            engineSubscriptions.delete(engine);
        };

        // Seed with engines that already exist.
        for (const engine of AudioEngineV2Class.Instances) {
            subscribeEngine(engine);
        }

        // React to new engines.
        const engineCreatedObserver = OnAudioEngineV2CreatedObservable.add((engine) => {
            subscribeEngine(engine);
            entityAddedObservable.notifyObservers(engine);
            engineDisplayNameChangedObservable.notifyObservers();
        });

        const sectionRegistration = sceneExplorerService.addSection<AudioV2Entity>({
            displayName: "Audio V2",
            order: DefaultSectionsOrder.AudioV2,
            getRootEntities: () => [...AudioEngineV2Class.Instances],
            getEntityChildren: (entity) => {
                if (entity instanceof AudioEngineV2Class) {
                    const children: AudioV2Entity[] = [];
                    for (const node of entity.nodes) {
                        if (node instanceof MainAudioBus) {
                            children.push(node);
                        }
                    }
                    return children;
                }
                if (entity instanceof MainAudioBus || entity instanceof AudioBus) {
                    const children: AudioV2Entity[] = [];
                    for (const node of entity.engine.nodes) {
                        if (IsRoutable(node) && node.outBus === entity) {
                            children.push(node);
                        }
                    }
                    return children;
                }
                return [];
            },
            getEntityDisplayInfo: (entity) => {
                const onChangeObservable = new Observable<void>();

                let nodeNameObserver: ReturnType<AbstractNamedAudioNode["onNameChangedObservable"]["add"]> | null = null;
                let engineDisplayObserver: ReturnType<typeof engineDisplayNameChangedObservable.add> | null = null;

                if (entity instanceof AudioEngineV2Class) {
                    engineDisplayObserver = engineDisplayNameChangedObservable.add(() => onChangeObservable.notifyObservers());
                } else {
                    nodeNameObserver = entity.onNameChangedObservable.add(() => onChangeObservable.notifyObservers());
                }

                return {
                    get name() {
                        if (entity instanceof AudioEngineV2Class) {
                            return GetEngineDisplayName(entity);
                        }
                        return entity.name || `Unnamed ${entity.getClassName()}`;
                    },
                    onChange: onChangeObservable,
                    dispose: () => {
                        nodeNameObserver?.remove();
                        engineDisplayObserver?.remove();
                        onChangeObservable.clear();
                    },
                };
            },
            entityIcon: ({ entity }) => {
                const color = tokens.colorPaletteForestForeground2;
                if (entity instanceof AudioEngineV2Class) {
                    return <HeadphonesSoundWaveRegular color={color} />;
                }
                if (entity instanceof AbstractAudioBus) {
                    return <ArrowEnterUpRegular color={color} />;
                }
                if (entity instanceof StaticSound) {
                    return <SoundWaveCircleRegular color={color} />;
                }
                if (entity instanceof StreamingSound) {
                    return <SoundWaveCircleFilled color={color} />;
                }
                if (entity instanceof AbstractSoundSource) {
                    return <CatchUpRegular color={color} />;
                }
                return <></>;
            },
            getEntityAddedObservables: () => [entityAddedObservable],
            getEntityRemovedObservables: () => [entityRemovedObservable],
            getEntityMovedObservables: () => [entityMovedObservable],
        });

        return {
            dispose: () => {
                engineCreatedObserver.remove();
                for (const subscription of engineSubscriptions.values()) {
                    subscription.dispose();
                }
                engineSubscriptions.clear();
                for (const token of outBusInterceptors.values()) {
                    token.dispose();
                }
                outBusInterceptors.clear();
                entityAddedObservable.clear();
                entityRemovedObservable.clear();
                entityMovedObservable.clear();
                engineDisplayNameChangedObservable.clear();
                sectionRegistration.dispose();
            },
        };
    },
};
