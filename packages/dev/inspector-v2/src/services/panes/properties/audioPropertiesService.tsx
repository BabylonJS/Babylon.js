import type { ServiceDefinition } from "../../../modularity/serviceDefinition";
import type { IPropertiesService } from "./propertiesService";

import { Sound } from "core/Audio/sound";
import { SoundCommandProperties, SoundGeneralProperties } from "../../../components/properties/audio/soundProperties";
import { PropertiesServiceIdentity } from "./propertiesService";

export const AudioPropertiesServiceDefinition: ServiceDefinition<[], [IPropertiesService]> = {
    friendlyName: "Audio Properties",
    consumes: [PropertiesServiceIdentity],
    factory: (propertiesService) => {
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

        return {
            dispose: () => {
                soundContentRegistration.dispose();
            },
        };
    },
};
