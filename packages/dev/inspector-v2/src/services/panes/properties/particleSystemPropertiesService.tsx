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

function IsParticleSystem(entity: unknown): entity is ParticleSystem {
    return entity instanceof ParticleSystem;
}

function IsNonNodeParticleSystem(entity: unknown): entity is ParticleSystem {
    return entity instanceof ParticleSystem && !entity.isNodeGenerated;
}

export const ParticleSystemPropertiesServiceDefinition: ServiceDefinition<[], [IPropertiesService, ISelectionService]> = {
    friendlyName: "Particle System Properties",
    consumes: [PropertiesServiceIdentity, SelectionServiceIdentity],
    factory: (propertiesService, selectionService) => {
        // Register each section in its own call to keep ordering predictable across registrations.
        // Note: section `order` is not globally sorted across different registrations, so call order matters.

        const particleSystemGeneralContent = propertiesService.addSectionContent({
            key: "Particle System General Properties",
            predicate: IsParticleSystem,
            content: [
                {
                    section: "General",
                    order: 1,
                    component: ({ context }) => <ParticleSystemGeneralProperties particleSystem={context} />,
                },
            ],
        });

        // The Attractors section must not be visible at all (including the accordion entry) for node-generated systems.
        const particleSystemAttractorsContent = propertiesService.addSectionContent({
            key: "Particle System Attractors Properties",
            predicate: IsNonNodeParticleSystem,
            content: [
                {
                    section: "Attractors",
                    order: 2,
                    component: ({ context }) => <ParticleSystemAttractorProperties particleSystem={context} />,
                },
            ],
        });

        const particleSystemEmitterContent = propertiesService.addSectionContent({
            key: "Particle System Emitter Properties",
            predicate: IsParticleSystem,
            content: [
                {
                    section: "Emitter",
                    order: 3,
                    component: ({ context }) => <ParticleSystemEmitterProperties particleSystem={context} selectionService={selectionService} />,
                },
            ],
        });

        const particleSystemEmissionContent = propertiesService.addSectionContent({
            key: "Particle System Emission Properties",
            predicate: IsParticleSystem,
            content: [
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
            predicate: IsNonNodeParticleSystem,
            content: [
                {
                    section: "Size",
                    order: 5,
                    component: ({ context }) => <ParticleSystemSizeProperties particleSystem={context} />,
                },
            ],
        });

        // Lifetime is registered for all systems; the component limits the visible fields for node-generated systems.
        const particleSystemLifetimeContent = propertiesService.addSectionContent({
            key: "Particle System Lifetime Properties",
            predicate: IsParticleSystem,
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
            predicate: IsNonNodeParticleSystem,
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
            predicate: IsNonNodeParticleSystem,
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
            predicate: IsNonNodeParticleSystem,
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
                particleSystemGeneralContent.dispose();
                particleSystemAttractorsContent.dispose();
                particleSystemEmitterContent.dispose();
                particleSystemEmissionContent.dispose();
                particleSystemSizeContent.dispose();
                particleSystemLifetimeContent.dispose();
                particleSystemColorContent.dispose();
                particleSystemRotationContent.dispose();
                particleSystemSpritesheetContent.dispose();
            },
        };
    },
};
