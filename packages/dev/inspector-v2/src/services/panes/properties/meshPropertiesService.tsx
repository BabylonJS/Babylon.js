import type { ServiceDefinition } from "../../../modularity/serviceDefinition";
import type { IPropertiesService } from "./propertiesService";

import { AbstractMesh } from "core/Meshes/abstractMesh";
import { BooleanProperty } from "../../../components/booleanProperty";
import { PropertiesServiceIdentity } from "./propertiesService";
import { GeneralPropertiesSectionIdentity } from "./commonPropertiesService";

export const TransformsPropertiesSectionIdentity = Symbol("Transforms");

export const MeshPropertiesServiceDefinition: ServiceDefinition<[], [IPropertiesService]> = {
    friendlyName: "Mesh Properties",
    consumes: [PropertiesServiceIdentity],
    factory: (propertiesService) => {
        const transformsSectionRegistration = propertiesService.addSection({
            order: 1,
            identity: TransformsPropertiesSectionIdentity,
        });

        const contentRegistration = propertiesService.addSectionContent({
            key: "Mesh Properties",
            predicate: (entity: unknown) => entity instanceof AbstractMesh,
            content: [
                // "GENERAL" section.
                {
                    section: GeneralPropertiesSectionIdentity,
                    order: 1,
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
                },

                // "TRANSFORMS" section.
                {
                    section: TransformsPropertiesSectionIdentity,
                    order: 0,
                    component: ({ entity: mesh }) => {
                        return <div key="PositionTransform">Position: {mesh.position.toString()}</div>;
                    },
                },
            ],
        });

        return {
            dispose: () => {
                contentRegistration.dispose();
                transformsSectionRegistration.dispose();
            },
        };
    },
};
