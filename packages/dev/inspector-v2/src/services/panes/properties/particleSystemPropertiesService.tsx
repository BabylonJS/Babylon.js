import type { ServiceDefinition } from "../../../modularity/serviceDefinition";
import type { IPropertiesService } from "./propertiesService";

import { PropertiesServiceIdentity } from "./propertiesService";
import { ParticleSystemColorProperties, ParticleSystemEmissionProperties } from "../../../components/properties/particles/particleSystemProperties";
import { ParticleSystem } from "core/Particles";

export const EmissionSectionIdentity = Symbol("Emission");
export const ColorSectionIdentity = Symbol("Color");

export const ParticleSystemPropertiesServiceDefinition: ServiceDefinition<[], [IPropertiesService]> = {
    friendlyName: "Particle System Properties",
    consumes: [PropertiesServiceIdentity],
    factory: (propertiesService) => {
        // TODO-iv2 complete the ParticleSystemPropertiesService registrations and the ParticleSystemProperties component(s)

        const emissionSectionRegistration = propertiesService.addSection({
            order: 2,
            identity: EmissionSectionIdentity,
        });

        const colorSectionRegistration = propertiesService.addSection({
            order: 2,
            identity: ColorSectionIdentity,
        });

        const particleSystemContent = propertiesService.addSectionContent({
            key: "Particle System Properties",
            predicate: (entity: unknown): entity is ParticleSystem => entity instanceof ParticleSystem,
            content: [
                // "EMISSION" section.
                {
                    section: EmissionSectionIdentity,
                    order: 0,
                    component: ({ context }) => <ParticleSystemEmissionProperties particleSystem={context} />,
                },
                // "COLOR" section.
                {
                    section: ColorSectionIdentity,
                    order: 1,
                    component: ({ context }) => <ParticleSystemColorProperties particleSystem={context} />,
                },
            ],
        });
        return {
            dispose: () => {
                emissionSectionRegistration.dispose();
                colorSectionRegistration.dispose();
                particleSystemContent.dispose();
            },
        };
    },
};
