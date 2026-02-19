import type { ServiceDefinition } from "../modularity/serviceDefinition";
import type { IShellService } from "./shellService";

import { PersonFeedbackRegular } from "@fluentui/react-icons";

import { Button } from "shared-ui-components/fluent/primitives/button";
import { Tooltip } from "shared-ui-components/fluent/primitives/tooltip";
import { DefaultToolbarItemOrder } from "./defaultToolbarMetadata";
import { ShellServiceIdentity } from "./shellService";

export const UserFeedbackServiceDefinition: ServiceDefinition<[], [IShellService]> = {
    friendlyName: "User Feedback",
    consumes: [ShellServiceIdentity],
    factory: (shellService) => {
        shellService.addToolbarItem({
            key: "User Feedback",
            verticalLocation: "bottom",
            horizontalLocation: "right",
            order: DefaultToolbarItemOrder.Feedback,
            teachingMoment: {
                title: "Feedback",
                description: "Press this button to give feedback on Inspector v2 and help us prioritize new features and improvements!",
            },
            component: () => {
                return (
                    <Tooltip content="Give Feedback on Inspector v2">
                        <Button
                            appearance="subtle"
                            icon={PersonFeedbackRegular}
                            onClick={() => window.open("https://forum.babylonjs.com/t/introducing-inspector-v2/60937", "_blank")} // TODO: Replace this with a direct link to the announcement post.
                        />
                    </Tooltip>
                );
            },
        });
    },
};
