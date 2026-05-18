import { type ServiceDefinition } from "shared-ui-components/modularTool/modularity/serviceDefinition";
import { type ISelectionService, SelectionServiceIdentity } from "../../selectionService";
import { type IPropertiesService, PropertiesServiceIdentity } from "./propertiesService";

import { Sound } from "core/Audio/sound";
import { AbstractAudioBus } from "core/AudioV2/abstractAudio/abstractAudioBus";
import { AbstractSound } from "core/AudioV2/abstractAudio/abstractSound";
import { AbstractSoundSource } from "core/AudioV2/abstractAudio/abstractSoundSource";
import { AudioEngineV2 } from "core/AudioV2/abstractAudio/audioEngineV2";
import { StaticSound } from "core/AudioV2/abstractAudio/staticSound";
import { StreamingSound } from "core/AudioV2/abstractAudio/streamingSound";

import { SoundCommandProperties, SoundGeneralProperties } from "../../../components/properties/audio/soundProperties";
import { AudioV2SpatialAttachmentProperties } from "../../../components/properties/audio/audioV2SpatialProperties";
import {
    AudioV2BusGeneralProperties,
    AudioV2EngineCommandsProperties,
    AudioV2EngineGeneralProperties,
    AudioV2SoundCommandsProperties,
    AudioV2SoundGeneralProperties,
    AudioV2SoundPlaybackProperties,
    AudioV2SoundSourceGeneralProperties,
    AudioV2StaticSoundPlaybackProperties,
    AudioV2StreamingSoundPreloadProperties,
} from "../../../components/properties/audio/audioV2Properties";

export const AudioPropertiesServiceDefinition: ServiceDefinition<[], [IPropertiesService, ISelectionService]> = {
    friendlyName: "Audio Properties",
    consumes: [PropertiesServiceIdentity, SelectionServiceIdentity],
    factory: (propertiesService, selectionService) => {
        // --- v1 Sound (unchanged) ---
        const soundV1ContentRegistration = propertiesService.addSectionContent({
            key: "Sound General Properties",
            predicate: (entity: unknown) => entity instanceof Sound,
            content: [
                {
                    section: "General",
                    component: ({ context }) => <SoundGeneralProperties sound={context} />,
                },
                {
                    section: "Commands",
                    component: ({ context }) => <SoundCommandProperties sound={context} />,
                },
            ],
        });

        // --- v2 AudioEngineV2 ---
        const engineV2ContentRegistration = propertiesService.addSectionContent({
            key: "Audio V2 Engine Properties",
            predicate: (entity: unknown): entity is AudioEngineV2 => entity instanceof AudioEngineV2,
            content: [
                {
                    section: "General",
                    component: ({ context }) => <AudioV2EngineGeneralProperties engine={context} />,
                },
                {
                    section: "Commands",
                    component: ({ context }) => <AudioV2EngineCommandsProperties engine={context} />,
                },
            ],
        });

        // --- v2 Buses (Main + Audio) ---
        const busV2ContentRegistration = propertiesService.addSectionContent({
            key: "Audio V2 Bus Properties",
            predicate: (entity: unknown): entity is AbstractAudioBus => entity instanceof AbstractAudioBus,
            content: [
                {
                    section: "General",
                    component: ({ context }) => <AudioV2BusGeneralProperties bus={context} selectionService={selectionService} />,
                },
            ],
        });

        // --- v2 Sounds (Static + Streaming) ---
        const soundV2ContentRegistration = propertiesService.addSectionContent({
            key: "Audio V2 Sound Properties",
            predicate: (entity: unknown): entity is AbstractSound => entity instanceof AbstractSound,
            content: [
                {
                    section: "General",
                    component: ({ context }) => <AudioV2SoundGeneralProperties sound={context} selectionService={selectionService} />,
                },
                {
                    section: "Playback",
                    component: ({ context }) => <AudioV2SoundPlaybackProperties sound={context} />,
                },
                {
                    section: "Commands",
                    component: ({ context }) => <AudioV2SoundCommandsProperties sound={context} />,
                },
            ],
        });

        // --- v2 StaticSound (extra playback properties) ---
        const staticSoundV2ContentRegistration = propertiesService.addSectionContent({
            key: "Audio V2 Static Sound Properties",
            predicate: (entity: unknown): entity is StaticSound => entity instanceof StaticSound,
            content: [
                {
                    section: "Playback",
                    component: ({ context }) => <AudioV2StaticSoundPlaybackProperties sound={context} />,
                },
            ],
        });

        // --- v2 StreamingSound (preload status) ---
        const streamingSoundV2ContentRegistration = propertiesService.addSectionContent({
            key: "Audio V2 Streaming Sound Properties",
            predicate: (entity: unknown): entity is StreamingSound => entity instanceof StreamingSound,
            content: [
                {
                    section: "Streaming",
                    component: ({ context }) => <AudioV2StreamingSoundPreloadProperties sound={context} />,
                },
            ],
        });

        // --- v2 Sound Sources (microphone, audio-node) — non-Sound only ---
        const soundSourceV2ContentRegistration = propertiesService.addSectionContent({
            key: "Audio V2 Sound Source Properties",
            predicate: (entity: unknown): entity is AbstractSoundSource => entity instanceof AbstractSoundSource && !(entity instanceof AbstractSound),
            content: [
                {
                    section: "General",
                    component: ({ context }) => <AudioV2SoundSourceGeneralProperties source={context} selectionService={selectionService} />,
                },
            ],
        });

        // --- v2 Spatial attachment (any AbstractSoundSource currently spatial) ---
        const spatialV2ContentRegistration = propertiesService.addSectionContent({
            key: "Audio V2 Spatial Properties",
            predicate: (entity: unknown): entity is AbstractSoundSource => entity instanceof AbstractSoundSource && entity._isSpatial,
            content: [
                {
                    section: "Spatial",
                    component: ({ context }) => <AudioV2SpatialAttachmentProperties source={context} selectionService={selectionService} />,
                },
            ],
        });

        return {
            dispose: () => {
                soundV1ContentRegistration.dispose();
                engineV2ContentRegistration.dispose();
                busV2ContentRegistration.dispose();
                soundV2ContentRegistration.dispose();
                staticSoundV2ContentRegistration.dispose();
                streamingSoundV2ContentRegistration.dispose();
                soundSourceV2ContentRegistration.dispose();
                spatialV2ContentRegistration.dispose();
            },
        };
    },
};
