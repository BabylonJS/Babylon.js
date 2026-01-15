import type { ServiceDefinition } from "../../../modularity/serviceDefinition";
import type { IPropertiesService } from "./propertiesService";
import type { ISelectionService } from "../../selectionService";

import { PropertiesServiceIdentity } from "./propertiesService";
import { SelectionServiceIdentity } from "../../selectionService";
import { ParticleSystem } from "core/Particles/particleSystem";
import { GPUParticleSystem } from "core/Particles/gpuParticleSystem";

import { ParticleSystemGeneralProperties } from "../../../components/properties/particles/regular/generalProperties";
import { ParticleSystemCommandProperties } from "../../../components/properties/particles/regular/commandsProperties";
import { ParticleSystemEmitterProperties } from "../../../components/properties/particles/regular/emitterProperties";
import { ParticleSystemSizeProperties } from "../../../components/properties/particles/regular/sizeProperties";
import { ParticleSystemEmissionProperties } from "../../../components/properties/particles/regular/emissionProperties";
import { ParticleSystemLifetimeProperties } from "../../../components/properties/particles/regular/lifetimeProperties";
import { ParticleSystemColorProperties } from "../../../components/properties/particles/regular/colorProperties";
import { ParticleSystemRotationProperties } from "../../../components/properties/particles/regular/rotationProperties";
import { ParticleSystemSpritesheetProperties } from "../../../components/properties/particles/regular/spritesheetProperties";
import { ParticleSystemAttractorProperties } from "../../../components/properties/particles/regular/attractorProperties";

import { NodeParticleSystemGeneralProperties } from "../../../components/properties/particles/node/generalProperties";

function IsCPUParticleSystem(entity: unknown): entity is ParticleSystem {
    return entity instanceof ParticleSystem && !entity.isNodeGenerated;
}

function IsCPUorGPUParticleSystem(entity: unknown): entity is ParticleSystem | GPUParticleSystem {
    return (entity instanceof ParticleSystem && !entity.isNodeGenerated) || entity instanceof GPUParticleSystem;
}

function IsNodeParticleSystem(entity: unknown): entity is ParticleSystem {
    return entity instanceof ParticleSystem && entity.isNodeGenerated;
}

// TODO: This file and particleSystemProperties.tsx still need to handle CPU vs GPU systems differently where applicable.
export const ParticleSystemPropertiesServiceDefinition: ServiceDefinition<[], [IPropertiesService, ISelectionService]> = {
    friendlyName: "Particle System Properties",
    consumes: [PropertiesServiceIdentity, SelectionServiceIdentity],
    factory: (propertiesService, selectionService) => {
        // Register each section in its own call to keep ordering predictable across registrations.
        // Note: section `order` is not globally sorted across different registrations, so call order matters.

        // Register sections for non-node-generated particle systems.
        const particleSystemGeneralContent = propertiesService.addSectionContent({
            key: "Particle System General Properties",
            predicate: IsCPUorGPUParticleSystem,
            content: [
                {
                    section: "General",
                    order: 1,
                    component: ({ context }) => <ParticleSystemGeneralProperties particleSystem={context} selectionService={selectionService} />,
                },
            ],
        });

        // Register sections for non-node-generated particle systems.
        const particleSystemCommandsContent = propertiesService.addSectionContent({
            key: "Particle System Commands Properties",
            predicate: IsCPUorGPUParticleSystem,
            content: [
                {
                    section: "Commands",
                    order: 2,
                    component: ({ context }) => <ParticleSystemCommandProperties particleSystem={context} selectionService={selectionService} />,
                },
            ],
        });

        // The Attractors section must not be visible at all (including the accordion entry) for CPU systems.
        const particleSystemAttractorsContent = propertiesService.addSectionContent({
            key: "Particle System Attractors Properties",
            predicate: IsCPUParticleSystem,
            content: [
                {
                    section: "Attractors",
                    order: 3,
                    component: ({ context }) => <ParticleSystemAttractorProperties particleSystem={context} />,
                },
            ],
        });

        const particleSystemEmitterContent = propertiesService.addSectionContent({
            key: "Particle System Emitter Properties",
            predicate: IsCPUorGPUParticleSystem,
            content: [
                {
                    section: "Emitter",
                    order: 4,
                    component: ({ context }) => <ParticleSystemEmitterProperties particleSystem={context} selectionService={selectionService} />,
                },
            ],
        });

        const particleSystemEmissionContent = propertiesService.addSectionContent({
            key: "Particle System Emission Properties",
            predicate: IsCPUorGPUParticleSystem,
            content: [
                {
                    section: "Emission",
                    order: 5,
                    component: ({ context }) => <ParticleSystemEmissionProperties particleSystem={context} />,
                },
            ],
        });

        // The Size section must not be visible at all (including the accordion entry) for node-generated systems.
        const particleSystemSizeContent = propertiesService.addSectionContent({
            key: "Particle System Size Properties",
            predicate: IsCPUorGPUParticleSystem,
            content: [
                {
                    section: "Size",
                    order: 6,
                    component: ({ context }) => <ParticleSystemSizeProperties particleSystem={context} />,
                },
            ],
        });

        // Lifetime is registered for all systems; the component limits the visible fields for node-generated systems.
        const particleSystemLifetimeContent = propertiesService.addSectionContent({
            key: "Particle System Lifetime Properties",
            predicate: IsCPUorGPUParticleSystem,
            content: [
                {
                    section: "Lifetime",
                    order: 7,
                    component: ({ context }) => <ParticleSystemLifetimeProperties particleSystem={context} />,
                },
            ],
        });

        // Register Color after Lifetime.
        const particleSystemColorContent = propertiesService.addSectionContent({
            key: "Particle System Color Properties",
            predicate: IsCPUorGPUParticleSystem,
            content: [
                {
                    section: "Colors",
                    order: 8,
                    component: ({ context }) => <ParticleSystemColorProperties particleSystem={context} />,
                },
            ],
        });

        // Register Rotation after Colors.
        const particleSystemRotationContent = propertiesService.addSectionContent({
            key: "Particle System Rotation Properties",
            predicate: IsCPUorGPUParticleSystem,
            content: [
                {
                    section: "Rotation",
                    order: 9,
                    component: ({ context }) => <ParticleSystemRotationProperties particleSystem={context} />,
                },
            ],
        });

        // Register Spritesheet after Rotation.
        const particleSystemSpritesheetContent = propertiesService.addSectionContent({
            key: "Particle System Spritesheet Properties",
            predicate: IsCPUorGPUParticleSystem,
            content: [
                {
                    section: "Spritesheet",
                    order: 10,
                    component: ({ context }) => <ParticleSystemSpritesheetProperties particleSystem={context} />,
                },
            ],
        });

        // Register sections for node-generated particle systems.
        const nodeParticleSystemGeneralContent = propertiesService.addSectionContent({
            key: "Particle System General Properties",
            predicate: IsNodeParticleSystem,
            content: [
                {
                    section: "General",
                    order: 1,
                    component: ({ context }) => <NodeParticleSystemGeneralProperties particleSystem={context} selectionService={selectionService} />,
                },
            ],
        });

        return {
            dispose: () => {
                particleSystemGeneralContent.dispose();
                particleSystemCommandsContent.dispose();
                particleSystemAttractorsContent.dispose();
                particleSystemEmitterContent.dispose();
                particleSystemEmissionContent.dispose();
                particleSystemSizeContent.dispose();
                particleSystemLifetimeContent.dispose();
                particleSystemColorContent.dispose();
                particleSystemRotationContent.dispose();
                particleSystemSpritesheetContent.dispose();
                nodeParticleSystemGeneralContent.dispose();
            },
        };
    },
};
