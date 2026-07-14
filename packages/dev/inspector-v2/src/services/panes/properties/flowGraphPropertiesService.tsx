import { FlowGraph } from "core/FlowGraph/flowGraph";
import { type ServiceDefinition } from "shared-ui-components/modularTool/modularity/serviceDefinition";
import { type IPropertiesService, PropertiesServiceIdentity } from "./propertiesService";

import { FlowGraphGeneralProperties } from "../../../components/properties/flowGraph/flowGraphProperties";

export const FlowGraphPropertiesServiceDefinition: ServiceDefinition<[], [IPropertiesService]> = {
    friendlyName: "Flow Graph Properties",
    consumes: [PropertiesServiceIdentity],
    factory: (propertiesService) => {
        const flowGraphContentRegistration = propertiesService.addSectionContent({
            key: "Flow Graph General Properties",
            predicate: (entity: unknown) => entity instanceof FlowGraph,
            content: [
                {
                    section: "General",
                    component: ({ context }) => <FlowGraphGeneralProperties flowGraph={context} />,
                },
            ],
        });

        return {
            dispose: () => {
                flowGraphContentRegistration.dispose();
            },
        };
    },
};
