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
    ParticleSystemSizeProperties,
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
            ],
        });

        // The Size section must not be visible at all (including the accordion entry) for node-generated systems.
        const particleSystemSizeContent = propertiesService.addSectionContent({
            key: "Particle System Size Properties",
            predicate: (entity: unknown): entity is ParticleSystem => entity instanceof ParticleSystem && !entity.isNodeGenerated,
            content: [
                {
                    section: "Size",
                    order: 50,
                    component: ({ context }) => <ParticleSystemSizeProperties particleSystem={context} />,
                },
            ],
        });

        // Register Color after Size so the section order is: ... Emission, Size, Color.
        const particleSystemColorContent = propertiesService.addSectionContent({
            key: "Particle System Color Properties",
            predicate: (entity: unknown): entity is ParticleSystem => entity instanceof ParticleSystem && !entity.isNodeGenerated,
            content: [
                {
                    section: "Color",
                    order: 60,
                    component: ({ context }) => <ParticleSystemColorProperties particleSystem={context} />,
                },
            ],
        });
        return {
            dispose: () => {
                particleSystemContent.dispose();
                particleSystemSizeContent.dispose();
                particleSystemColorContent.dispose();
            },
        };
    },
};
