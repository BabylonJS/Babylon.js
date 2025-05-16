import type { ServiceDefinition } from "../../../modularity/serviceDefinition";
import type { IPropertiesService } from "./propertiesService";

import { AbstractMesh } from "core/Meshes/abstractMesh";
import { BooleanProperty } from "../../../components/booleanProperty";
import { PropertiesServiceIdentity } from "./propertiesService";
import { GeneralPropertiesSectionIdentity } from "./commonSectionsService";

export const TransformsPropertiesSectionIdentity = Symbol("Transforms");

export const MeshPropertiesServiceDefinition: ServiceDefinition<[], [IPropertiesService]> = {
    friendlyName: "Mesh Properties",
    consumes: [PropertiesServiceIdentity],
    factory: (propertiesService) => {
        const transformsSectionRegistration = propertiesService.addSection({
            order: 1,
            identity: TransformsPropertiesSectionIdentity,
            predicate: (entity: unknown) => entity instanceof AbstractMesh,
        });

        const generalPropertiesRegistration = propertiesService.addPropertiesProvider({
            order: 1,
            predicate: (entity: unknown, section: symbol): entity is AbstractMesh => section === GeneralPropertiesSectionIdentity && entity instanceof AbstractMesh,
            component: ({ entity: mesh }) => {
                return (
                    <BooleanProperty
                        key="MeshIsEnabled"
                        label="Is enabled"
                        description="Determines whether a mesh is enabled within the scene"
                        accessor={() => mesh.isEnabled(false)}
                        mutator={(value) => mesh.setEnabled(value)}
                        observable={mesh.onEnabledStateChangedObservable}
                    />
                );
            },
        });

        const transformsPropertiesRegistration = propertiesService.addPropertiesProvider({
            order: 0,
            predicate: (entity: unknown, section: symbol): entity is AbstractMesh => section === TransformsPropertiesSectionIdentity && entity instanceof AbstractMesh,
            component: ({ entity: mesh }) => {
                return <div key="PositionTransform">Position: {mesh.position.toString()}</div>;
            },
        });

        return {
            dispose: () => {
                generalPropertiesRegistration.dispose();
                transformsPropertiesRegistration.dispose();
                transformsSectionRegistration.dispose();
            },
        };
    },
};
