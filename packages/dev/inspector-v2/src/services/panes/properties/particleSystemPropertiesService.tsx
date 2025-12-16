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
    ParticleSystemLifetimeProperties,
    ParticleSystemColorProperties,
    ParticleSystemRotationProperties,
    ParticleSystemSpritesheetProperties,
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
                    order: 1,
                    component: ({ context }) => <ParticleSystemGeneralProperties particleSystem={context} />,
                },
                {
                    section: "Attractors",
                    order: 2,
                    component: ({ context }) => <ParticleSystemAttractorProperties particleSystem={context} />,
                },
                {
                    section: "Emitter",
                    order: 3,
                    component: ({ context }) => <ParticleSystemEmitterProperties particleSystem={context} selectionService={selectionService} />,
                },
                {
                    section: "Emission",
                    order: 4,
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
                    order: 5,
                    component: ({ context }) => <ParticleSystemSizeProperties particleSystem={context} />,
                },
            ],
        });

        // The Lifetime section is only visible for non-node-based systems.
        const particleSystemLifetimeContent = propertiesService.addSectionContent({
            key: "Particle System Lifetime Properties",
            predicate: (entity: unknown): entity is ParticleSystem => entity instanceof ParticleSystem,
            content: [
                {
                    section: "Lifetime",
                    order: 6,
                    component: ({ context }) => <ParticleSystemLifetimeProperties particleSystem={context} />,
                },
            ],
        });

        // Register Color after Lifetime.
        const particleSystemColorContent = propertiesService.addSectionContent({
            key: "Particle System Color Properties",
            predicate: (entity: unknown): entity is ParticleSystem => entity instanceof ParticleSystem && !entity.isNodeGenerated,
            content: [
                {
                    section: "Colors",
                    order: 7,
                    component: ({ context }) => <ParticleSystemColorProperties particleSystem={context} />,
                },
            ],
        });

        // Register Rotation after Colors.
        const particleSystemRotationContent = propertiesService.addSectionContent({
            key: "Particle System Rotation Properties",
            predicate: (entity: unknown): entity is ParticleSystem => entity instanceof ParticleSystem && !entity.isNodeGenerated,
            content: [
                {
                    section: "Rotation",
                    order: 8,
                    component: ({ context }) => <ParticleSystemRotationProperties particleSystem={context} />,
                },
            ],
        });

        // Register Spritesheet after Rotation.
        const particleSystemSpritesheetContent = propertiesService.addSectionContent({
            key: "Particle System Spritesheet Properties",
            predicate: (entity: unknown): entity is ParticleSystem => entity instanceof ParticleSystem && !entity.isNodeGenerated,
            content: [
                {
                    section: "Spritesheet",
                    order: 9,
                    component: ({ context }) => <ParticleSystemSpritesheetProperties particleSystem={context} />,
                },
            ],
        });
        return {
            dispose: () => {
                particleSystemContent.dispose();
                particleSystemSizeContent.dispose();
                particleSystemLifetimeContent.dispose();
                particleSystemColorContent.dispose();
                particleSystemRotationContent.dispose();
                particleSystemSpritesheetContent.dispose();
            },
        };
    },
};
