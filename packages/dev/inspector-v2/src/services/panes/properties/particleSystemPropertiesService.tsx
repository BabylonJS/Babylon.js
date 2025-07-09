import type { ServiceDefinition } from "../../../modularity/serviceDefinition";
import type { IPropertiesService } from "./propertiesService";

import { PropertiesServiceIdentity } from "./propertiesService";
import { ParticleSystemProperties } from "../../../components/properties/particleSystemProperties";
import { ParticleSystem } from "core/Particles";

export const EmissionSectionIdentity = Symbol("Emission");

export const ParticleSystemPropertiesServiceDefinition: ServiceDefinition<[], [IPropertiesService]> = {
    friendlyName: "Particle System Properties",
    consumes: [PropertiesServiceIdentity],
    factory: (propertiesService) => {
        // Emission
        const emissionSectionRegistration = propertiesService.addSection({
            order: 0,
            identity: EmissionSectionIdentity,
        });

        const particleSystemContent = propertiesService.addSectionContent({
            key: "Particle System Properties",
            predicate: (entity: unknown): entity is ParticleSystem => entity instanceof ParticleSystem,
            content: [
                // "EMISSION" section.
                {
                    section: EmissionSectionIdentity,
                    order: 0,
                    component: ({ context }) => <ParticleSystemProperties particleSystem={context} />,
                },
            ],
        });
        return {
            dispose: () => {
                emissionSectionRegistration.dispose();
                particleSystemContent.dispose();
            },
        };
    },
};
