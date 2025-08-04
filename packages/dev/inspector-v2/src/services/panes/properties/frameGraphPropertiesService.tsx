import { FrameGraph } from "core/FrameGraph/frameGraph";
import type { ServiceDefinition } from "../../../modularity/serviceDefinition";
import type { IPropertiesService } from "./propertiesService";

import { PropertiesServiceIdentity } from "./propertiesService";
import { FrameGraphGeneralProperties } from "../../../components/properties/frameGraph/frameGraphGeneralProperties";
import { FrameGraphTaskProperties } from "../../../components/properties/frameGraph/frameGraphTasksProperties";

export const FrameGraphPropertiesServiceDefinition: ServiceDefinition<[], [IPropertiesService]> = {
    friendlyName: "Frame Graph Properties",
    consumes: [PropertiesServiceIdentity],
    factory: (propertiesService) => {
        const frameGraphContentRegistration = propertiesService.addSectionContent({
            key: "Frame Graph General Properties",
            predicate: (entity: unknown) => entity instanceof FrameGraph,
            content: [
                {
                    section: "General",
                    component: ({ context }) => <FrameGraphGeneralProperties frameGraph={context} />,
                },
                {
                    section: "Tasks",
                    component: ({ context }) => <FrameGraphTaskProperties frameGraph={context} />,
                },
            ],
        });

        return {
            dispose: () => {
                frameGraphGeneralContentRegistration.dispose();
                frameGraphTasksContentRegistration.dispose();
            },
        };
    },
};
