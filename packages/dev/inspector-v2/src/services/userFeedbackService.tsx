import type { ServiceDefinition } from "../modularity/serviceDefinition";
import type { IShellService } from "./shellService";

import { ShellServiceIdentity } from "./shellService";
import { Button } from "shared-ui-components/fluent/primitives/button";

import { PersonFeedbackRegular } from "@fluentui/react-icons";

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
                    <Button
                        appearance="subtle"
                        icon={PersonFeedbackRegular}
                        title="Give Feedback on Inspector v2"
                        onClick={() => window.open("https://forum.babylonjs.com/t/introducing-inspector-v2/60937", "_blank")} // TODO: Replace this with a direct link to the announcement post.
                    />
                );
            },
        });
    },
};
