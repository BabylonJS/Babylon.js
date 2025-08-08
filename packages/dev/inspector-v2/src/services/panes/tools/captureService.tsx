import type { ServiceDefinition } from "../../../modularity/serviceDefinition";
import { ToolsServiceIdentity } from "../toolsService";
import type { IToolsService } from "../toolsService";
import type { IDisposable } from "core/scene";
import { CaptureRttTools, CaptureScreenshotTools } from "../../../components/tools/captureTools";

export const CaptureServiceDefinition: ServiceDefinition<[], [IToolsService]> = {
    friendlyName: "Capture Tools",
    consumes: [ToolsServiceIdentity],
    factory: (toolsService) => {
        const contentRegistrations: IDisposable[] = [];

        // Screenshot capture content
        contentRegistrations.push(
            toolsService.addSectionContent({
                key: "Screenshot Capture",
                section: "Screenshot Capture",
                component: ({ context }) => <CaptureScreenshotTools scene={context} />,
            })
        );

        // RTT capture content
        contentRegistrations.push(
            toolsService.addSectionContent({
                key: "RTT Capture",
                section: "RTT Capture",
                component: ({ context }) => <CaptureRttTools scene={context} />,
            })
        );

        return {
            dispose: () => {
                contentRegistrations.forEach((registration) => registration.dispose());
            },
        };
    },
};

export default {
    serviceDefinitions: [CaptureServiceDefinition],
} as const;
