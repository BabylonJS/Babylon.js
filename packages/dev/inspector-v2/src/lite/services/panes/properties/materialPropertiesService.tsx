import { getMaterialFamily, type Material } from "@babylonjs/lite";
import { type FunctionComponent } from "react";

import { TextInputPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/inputPropertyLine";
import { TextPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/textPropertyLine";
import { type ServiceDefinition } from "shared-ui-components/modularTool/modularity/serviceDefinition";

import { BoundProperty } from "../../../../components/properties/boundProperty";
import { type IPropertiesService, PropertiesServiceIdentity } from "../../../../services/panes/properties/propertiesService";

function IsMaterial(entity: unknown): entity is Material {
    return typeof entity === "object" && entity !== null && getMaterialFamily(entity as Material) !== undefined;
}

const MaterialProperties: FunctionComponent<{ material: Material }> = (props) => {
    const { material } = props;

    return (
        <>
            <BoundProperty component={TextInputPropertyLine} label="Name" target={material} propertyKey="name" ignoreNullable defaultValue="" />
            <TextPropertyLine label="Family" value={getMaterialFamily(material) ?? "Unknown"} />
        </>
    );
};

export const MaterialPropertiesServiceDefinition: ServiceDefinition<[], [IPropertiesService]> = {
    friendlyName: "Babylon Lite Material Properties",
    consumes: [PropertiesServiceIdentity],
    factory: (propertiesService) =>
        propertiesService.addSectionContent({
            key: "Babylon Lite Material Properties",
            predicate: IsMaterial,
            content: [
                {
                    section: "General",
                    component: ({ context }) => <MaterialProperties material={context} />,
                },
            ],
        }),
};
