import { PostProcess } from "core/PostProcesses/postProcess";
import { PostProcessProperties } from "../../../components/properties/postProcesses/postProcessProperties";
import type { ServiceDefinition } from "../../../modularity/serviceDefinition";
import type { IPropertiesService } from "./propertiesService";

import { PropertiesServiceIdentity } from "./propertiesService";

export const PostProcessPropertiesServiceDefinition: ServiceDefinition<[], [IPropertiesService]> = {
    friendlyName: "Post Process Properties",
    consumes: [PropertiesServiceIdentity],
    factory: (propertiesService) => {
        const postProcessContentRegistration = propertiesService.addSectionContent({
            key: "Post Process Properties",
            predicate: (entity: unknown) => entity instanceof PostProcess,
            content: [
                {
                    section: "General",
                    component: ({ context }) => <PostProcessProperties postProcess={context} />,
                },
            ],
        });

        return {
            dispose: () => {
                postProcessContentRegistration.dispose();
            },
        };
    },
};
