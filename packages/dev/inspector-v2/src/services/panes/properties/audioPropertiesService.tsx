import { type ServiceDefinition } from "shared-ui-components/modularTool/modularity/serviceDefinition";
import { type ISelectionService, SelectionServiceIdentity } from "../../selectionService";
import { type IPropertiesService, PropertiesServiceIdentity } from "./propertiesService";

import { Sound } from "core/Audio/sound";
import { AbstractSoundSource } from "core/AudioV2/abstractAudio/abstractSoundSource";
import { SoundCommandProperties, SoundGeneralProperties } from "../../../components/properties/audio/soundProperties";
import { AudioV2SpatialAttachmentProperties } from "../../../components/properties/audio/audioV2SpatialProperties";

export const AudioPropertiesServiceDefinition: ServiceDefinition<[], [IPropertiesService, ISelectionService]> = {
    friendlyName: "Audio Properties",
    consumes: [PropertiesServiceIdentity, SelectionServiceIdentity],
    factory: (propertiesService, selectionService) => {
        const soundContentRegistration = propertiesService.addSectionContent({
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

        const audioV2SpatialContentRegistration = propertiesService.addSectionContent({
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
                soundContentRegistration.dispose();
                audioV2SpatialContentRegistration.dispose();
            },
        };
    },
};
