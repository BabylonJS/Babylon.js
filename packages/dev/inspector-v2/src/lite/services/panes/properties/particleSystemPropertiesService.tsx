import { type ParticleSystem } from "@babylonjs/lite";

import { MakeLazyComponent } from "shared-ui-components/fluent/primitives/lazyComponent";
import { type ServiceDefinition } from "shared-ui-components/modularTool/modularity/serviceDefinition";

import { type IPropertiesService, PropertiesServiceIdentity } from "../../../../services/panes/properties/propertiesService";
import { type IEngineContext, EngineContextIdentity } from "../../../engineContext";
import { IsParticleSystem } from "../../../particleUtils";

const ParticleSystemGeneralProperties = MakeLazyComponent(async () => (await import("../../../components/properties/particleSystemProperties")).ParticleSystemGeneralProperties);
const ParticleSystemCommandProperties = MakeLazyComponent(async () => (await import("../../../components/properties/particleSystemProperties")).ParticleSystemCommandProperties);
const ParticleSystemEmissionProperties = MakeLazyComponent(async () => (await import("../../../components/properties/particleSystemProperties")).ParticleSystemEmissionProperties);

/** Registers lazy CPU particle properties without exposing graph internals. */
export const ParticleSystemPropertiesServiceDefinition: ServiceDefinition<[], [IPropertiesService, IEngineContext]> = {
    friendlyName: "Babylon Lite Particle System Properties",
    consumes: [PropertiesServiceIdentity, EngineContextIdentity],
    factory: (propertiesService, engineContext) => {
        const registration = propertiesService.addSectionContent({
            key: "Babylon Lite Particle System Properties",
            predicate: (entity): entity is ParticleSystem => IsParticleSystem(engineContext.engine, entity),
            content: [
                { section: "General", component: ({ context }) => <ParticleSystemGeneralProperties system={context} /> },
                { section: "Commands", component: ({ context }) => <ParticleSystemCommandProperties system={context} /> },
                { section: "Emission", component: ({ context }) => <ParticleSystemEmissionProperties system={context} /> },
            ],
        });
        return { dispose: () => registration.dispose() };
    },
};
