import { type Texture2D } from "@babylonjs/lite";
import { type FunctionComponent } from "react";

import { BooleanBadgePropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/booleanBadgePropertyLine";
import { StringifiedPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/stringifiedPropertyLine";
import { type ServiceDefinition } from "shared-ui-components/modularTool/modularity/serviceDefinition";

import { type IPropertiesService, PropertiesServiceIdentity } from "../../../../services/panes/properties/propertiesService";

function IsTexture2D(entity: unknown): entity is Texture2D {
    if (typeof entity !== "object" || entity === null) {
        return false;
    }

    const texture = entity as Partial<Texture2D>;
    return typeof texture.width === "number" && typeof texture.height === "number" && texture.texture !== undefined && texture.view !== undefined && texture.sampler !== undefined;
}

const TextureProperties: FunctionComponent<{ texture: Texture2D }> = (props) => {
    const { texture } = props;

    return (
        <>
            <StringifiedPropertyLine label="Width" value={texture.width} units="px" />
            <StringifiedPropertyLine label="Height" value={texture.height} units="px" />
            <BooleanBadgePropertyLine label="Invert Y" value={texture.invertY ?? false} />
        </>
    );
};

export const TexturePropertiesServiceDefinition: ServiceDefinition<[], [IPropertiesService]> = {
    friendlyName: "Babylon Lite Texture Properties",
    consumes: [PropertiesServiceIdentity],
    factory: (propertiesService) =>
        propertiesService.addSectionContent({
            key: "Babylon Lite Texture Properties",
            predicate: IsTexture2D,
            content: [
                {
                    section: "General",
                    component: ({ context }) => <TextureProperties texture={context} />,
                },
            ],
        }),
};
