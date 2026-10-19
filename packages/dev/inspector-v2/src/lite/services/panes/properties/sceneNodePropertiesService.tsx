import { type ServiceDefinition } from "shared-ui-components/modularTool/modularity/serviceDefinition";

import { MetadataProperties } from "../../../../components/properties/metadataProperties";
import { type IPropertiesService, PropertiesServiceIdentity } from "../../../../services/panes/properties/propertiesService";
import { IsSceneNode } from "../../../sceneEntityUtils";
import { SceneNodeGeneralProperties, SceneNodeTransformProperties } from "../../../components/properties/sceneNodeProperties";

export const SceneNodePropertiesServiceDefinition: ServiceDefinition<[], [IPropertiesService]> = {
    friendlyName: "Babylon Lite Scene Node Properties",
    consumes: [PropertiesServiceIdentity],
    factory: (propertiesService) =>
        propertiesService.addSectionContent({
            key: "Babylon Lite Scene Node Properties",
            predicate: IsSceneNode,
            content: [
                {
                    section: "General",
                    component: ({ context }) => <SceneNodeGeneralProperties node={context} />,
                },
                {
                    section: "Transform",
                    component: ({ context }) => <SceneNodeTransformProperties node={context} />,
                },
                {
                    section: "Metadata",
                    component: ({ context }) => <MetadataProperties entity={context} />,
                },
            ],
        }),
};
