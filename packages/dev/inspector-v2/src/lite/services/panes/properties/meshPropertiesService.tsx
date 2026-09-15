import { type Mesh } from "@babylonjs/lite";
import { type FunctionComponent } from "react";

import { SwitchPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/switchPropertyLine";
import { type ServiceDefinition } from "shared-ui-components/modularTool/modularity/serviceDefinition";

import { BoundProperty } from "../../../../components/properties/boundProperty";
import { type IPropertiesService, PropertiesServiceIdentity } from "../../../../services/panes/properties/propertiesService";
import { IsMesh } from "../../../sceneEntityUtils";

const MeshGeneralProperties: FunctionComponent<{ mesh: Mesh }> = (props) => {
    const { mesh } = props;

    return <BoundProperty component={SwitchPropertyLine} label="Receive Shadows" target={mesh} propertyKey="receiveShadows" />;
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
                    section: "Rendering",
                    component: ({ context }) => <MeshGeneralProperties mesh={context} />,
                },
            ],
        }),
};
