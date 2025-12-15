import type { ServiceDefinition } from "../../../modularity/serviceDefinition";
import type { IPropertiesService } from "./propertiesService";
import type { ISelectionService } from "../../selectionService";

import { PropertiesServiceIdentity } from "./propertiesService";
import { SelectionServiceIdentity } from "../../selectionService";
import {
    ParticleSystemGeneralProperties,
    ParticleSystemAttractorProperties,
    ParticleSystemEmitterProperties,
    ParticleSystemEmissionProperties,
    ParticleSystemColorProperties,
} from "../../../components/properties/particles/particleSystemProperties";
import { ParticleSystem } from "core/Particles/particleSystem";

export const ParticleSystemPropertiesServiceDefinition: ServiceDefinition<[], [IPropertiesService, ISelectionService]> = {
    friendlyName: "Particle System Properties",
    consumes: [PropertiesServiceIdentity, SelectionServiceIdentity],
    factory: (propertiesService, selectionService) => {
        // TODO-iv2 complete the ParticleSystemPropertiesService registrations and the ParticleSystemProperties component(s) - ensuring the proper predicates (IParticleSystem vs ParticleSystem)

        const particleSystemContent = propertiesService.addSectionContent({
            key: "Particle System Properties",
            predicate: (entity: unknown): entity is ParticleSystem => entity instanceof ParticleSystem,
            content: [
                {
                    section: "General",
                    order: 10,
                    component: ({ context }) => <ParticleSystemGeneralProperties particleSystem={context} />,
                },
                {
                    section: "Attractors",
                    component: ({ context }) => <ParticleSystemAttractorProperties particleSystem={context} />,
                },
                {
                    section: "Emitter",
                    component: ({ context }) => <ParticleSystemEmitterProperties particleSystem={context} selectionService={selectionService} />,
                },
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
