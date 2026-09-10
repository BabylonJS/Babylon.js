import { type Mesh } from "@babylonjs/lite";
import { type FunctionComponent } from "react";

import { TextInputPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/inputPropertyLine";
import { SwitchPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/switchPropertyLine";
import { type ServiceDefinition } from "shared-ui-components/modularTool/modularity/serviceDefinition";

import { BoundProperty } from "../../../../components/properties/boundProperty";
import { type IPropertiesService, PropertiesServiceIdentity } from "../../../../services/panes/properties/propertiesService";

function IsMesh(entity: unknown): entity is Mesh {
    return typeof entity === "object" && entity !== null && "_gpu" in entity && "material" in entity;
}

const MeshGeneralProperties: FunctionComponent<{ mesh: Mesh }> = (props) => {
    const { mesh } = props;

    return (
        <>
            <BoundProperty component={TextInputPropertyLine} label="Name" target={mesh} propertyKey="name" />
            <BoundProperty component={SwitchPropertyLine} label="Receive Shadows" target={mesh} propertyKey="receiveShadows" />
        </>
    );
};

export const MeshPropertiesServiceDefinition: ServiceDefinition<[], [IPropertiesService]> = {
    friendlyName: "Babylon Lite Mesh Properties",
    consumes: [PropertiesServiceIdentity],
    factory: (propertiesService) =>
        propertiesService.addSectionContent({
            key: "Babylon Lite Mesh Properties",
            predicate: IsMesh,
            content: [
                {
                    section: "General",
                    component: ({ context }) => <MeshGeneralProperties mesh={context} />,
                },
            ],
        }),
};
