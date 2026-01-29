import type { ServiceDefinition } from "../modularity/serviceDefinition";
import type { IShellService } from "./shellService";

import { PersonFeedbackRegular } from "@fluentui/react-icons";

import { Button } from "shared-ui-components/fluent/primitives/button";
import { Tooltip } from "shared-ui-components/fluent/primitives/tooltip";
import { ShellServiceIdentity } from "./shellService";

export const UserFeedbackServiceDefinition: ServiceDefinition<[], [IShellService]> = {
    friendlyName: "User Feedback",
    consumes: [ShellServiceIdentity],
    factory: (shellService) => {
        shellService.addToolbarItem({
            key: "User Feedback",
            verticalLocation: "bottom",
            horizontalLocation: "right",
            suppressTeachingMoment: true,
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
