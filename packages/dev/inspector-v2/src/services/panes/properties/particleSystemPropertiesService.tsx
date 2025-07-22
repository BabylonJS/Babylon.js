import type { ServiceDefinition } from "../../../modularity/serviceDefinition";
import type { IPropertiesService } from "./propertiesService";

import { PropertiesServiceIdentity } from "./propertiesService";
import { ParticleSystemColorProperties, ParticleSystemEmissionProperties } from "../../../components/properties/particles/particleSystemProperties";
import { ParticleSystem } from "core/Particles";

export const ParticleSystemPropertiesServiceDefinition: ServiceDefinition<[], [IPropertiesService]> = {
    friendlyName: "Particle System Properties",
    consumes: [PropertiesServiceIdentity],
    factory: (propertiesService) => {
        // TODO-iv2 complete the ParticleSystemPropertiesService registrations and the ParticleSystemProperties component(s)

        const particleSystemContent = propertiesService.addSectionContent({
            key: "Particle System Properties",
            predicate: (entity: unknown): entity is ParticleSystem => entity instanceof ParticleSystem,
            content: [
                {
                    section: "Emission",
                    component: ({ context }) => <ParticleSystemEmissionProperties particleSystem={context} />,
                },
                {
                    section: "Color",
                    component: ({ context }) => <ParticleSystemColorProperties particleSystem={context} />,
                },
            ],
        });
        return {
            dispose: () => {
                particleSystemContent.dispose();
            },
        };
    },
};
