import { type AudioBus, type AudioEngine, type AudioInputSource, type Camera, type MainBus, type SceneNode, type StaticSound, type StreamingSound } from "@babylonjs/lite";
import { type ServiceDefinition } from "shared-ui-components/modularTool/modularity/serviceDefinition";

import { type IPropertiesService, PropertiesServiceIdentity } from "../../../../services/panes/properties/propertiesService";
import { type ISelectionService, SelectionServiceIdentity } from "../../../../services/selectionService";
import { type IAudioEngineContext, AudioEngineContextIdentity } from "../../../audioEngineContext";
import { GetLiteAudioEntry, GetLiteAudioGraph } from "../../../audioEngineGraph";
import { IsCamera, IsSceneNode } from "../../../sceneEntityUtils";
import {
    LiteAttachedAudioProperties,
    LiteAudioBusProperties,
    LiteAudioEngineProperties,
    LiteAudioSoundCommands,
    LiteAudioSoundProperties,
    LiteAudioSourceProperties,
    LiteAudioSpatialProperties,
} from "../../../components/properties/audioProperties";

/** Registers properties and controls for the attached Lite audio graph. */
export const LiteAudioPropertiesServiceDefinition: ServiceDefinition<[], [IPropertiesService, IAudioEngineContext, ISelectionService]> = {
    friendlyName: "Babylon Lite Audio Properties",
    consumes: [PropertiesServiceIdentity, AudioEngineContextIdentity, SelectionServiceIdentity],
    factory: (propertiesService, audioEngineContext, selectionService) => {
        const getEntry = (entity: unknown) => {
            const engine = audioEngineContext.audioEngine;
            const graph = engine && GetLiteAudioGraph(engine);
            return graph ? GetLiteAudioEntry(graph, entity) : undefined;
        };
        const registrations = [
            propertiesService.addSectionContent({
                key: "Babylon Lite Attached Audio Properties",
                predicate: (entity: unknown): entity is SceneNode | Camera => IsSceneNode(entity) || IsCamera(entity),
                content: [
                    {
                        section: "Audio",
                        component: ({ context }) => <LiteAttachedAudioProperties target={context} audioEngineContext={audioEngineContext} selectionService={selectionService} />,
                    },
                ],
            }),
            propertiesService.addSectionContent({
                key: "Babylon Lite Audio Engine Properties",
                predicate: (entity: unknown): entity is AudioEngine => !!entity && entity === audioEngineContext.audioEngine,
                content: [
                    { section: "General", component: ({ context }) => <LiteAudioEngineProperties engine={context} /> },
                    { section: "Listener", component: ({ context }) => <LiteAudioSpatialProperties target={context} selectionService={selectionService} /> },
                ],
            }),
            propertiesService.addSectionContent({
                key: "Babylon Lite Audio Bus Properties",
                predicate: (entity: unknown): entity is AudioBus | MainBus => {
                    const kind = getEntry(entity)?.kind;
                    return kind === "main-bus" || kind === "bus";
                },
                content: [
                    {
                        section: "General",
                        component: ({ context }) => {
                            const engine = audioEngineContext.audioEngine;
                            return engine ? <LiteAudioBusProperties engine={engine} bus={context} selectionService={selectionService} /> : null;
                        },
                    },
                ],
            }),
            propertiesService.addSectionContent({
                key: "Babylon Lite Audio Sound Properties",
                predicate: (entity: unknown): entity is StaticSound | StreamingSound => {
                    const kind = getEntry(entity)?.kind;
                    return kind === "static-sound" || kind === "streaming-sound";
                },
                content: [
                    {
                        section: "General",
                        component: ({ context }) => {
                            const engine = audioEngineContext.audioEngine;
                            return engine ? <LiteAudioSoundProperties engine={engine} sound={context} selectionService={selectionService} /> : null;
                        },
                    },
                    {
                        section: "Commands",
                        component: ({ context }) => {
                            const engine = audioEngineContext.audioEngine;
                            return engine ? <LiteAudioSoundCommands engine={engine} sound={context} audioEngineContext={audioEngineContext} /> : null;
                        },
                    },
                ],
            }),
            propertiesService.addSectionContent({
                key: "Babylon Lite Audio Source Properties",
                predicate: (entity: unknown): entity is AudioInputSource => getEntry(entity)?.kind === "source",
                content: [
                    {
                        section: "General",
                        component: ({ context }) => {
                            const engine = audioEngineContext.audioEngine;
                            return engine ? <LiteAudioSourceProperties engine={engine} source={context} selectionService={selectionService} /> : null;
                        },
                    },
                ],
            }),
            propertiesService.addSectionContent({
                key: "Babylon Lite Spatial Audio Properties",
                predicate: (entity: unknown): entity is AudioBus | StaticSound | StreamingSound | AudioInputSource => {
                    const kind = getEntry(entity)?.kind;
                    return kind === "bus" || kind === "static-sound" || kind === "streaming-sound" || kind === "source";
                },
                content: [{ section: "Spatial", component: ({ context }) => <LiteAudioSpatialProperties target={context} selectionService={selectionService} /> }],
            }),
        ];
        return { dispose: () => registrations.forEach((registration) => registration.dispose()) };
    },
};
