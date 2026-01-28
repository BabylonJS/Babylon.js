import { EquirectangularCaptureTool } from "../../../components/tools/capture/equirectangularCaptureTool";
import { GIFCaptureTool } from "../../../components/tools/capture/gifCaptureTool";
import { SceneReplayTool } from "../../../components/tools/capture/sceneReplayTool";
import { ScreenshotTool } from "../../../components/tools/capture/screenshotTool";
import { VideoCaptureTool } from "../../../components/tools/capture/videoCaptureTool";
import type { ServiceDefinition } from "../../../modularity/serviceDefinition";
import { ToolsServiceIdentity } from "../toolsService";
import type { IToolsService } from "../toolsService";
import type { IDisposable } from "core/scene";

export const CaptureToolsDefinition: ServiceDefinition<[], [IToolsService]> = {
    friendlyName: "Capture Tools",
    consumes: [ToolsServiceIdentity],
    factory: (toolsService) => {
        const contentRegistrations: IDisposable[] = [];

        // Screenshot
        contentRegistrations.push(
            toolsService.addSectionContent({
                key: "Screenshot",
                section: "Screenshot",
                order: 10,
                component: ({ context }) => <ScreenshotTool scene={context} />,
            })
        );

        // Equirectangular capture
        contentRegistrations.push(
            toolsService.addSectionContent({
                key: "Equirectangular",
                section: "Equirectangular",
                order: 15,
                component: ({ context }) => <EquirectangularCaptureTool scene={context} />,
            })
        );

        // Video recorder
        contentRegistrations.push(
            toolsService.addSectionContent({
                key: "Video",
                section: "Video",
                order: 20,
                component: ({ context }) => <VideoCaptureTool scene={context} />,
            })
        );

        // GIF recorder
        contentRegistrations.push(
            toolsService.addSectionContent({
                key: "GIF",
                section: "GIF",
                order: 25,
                component: ({ context }) => <GIFCaptureTool scene={context} />,
            })
        );

        // Scene replay
        contentRegistrations.push(
            toolsService.addSectionContent({
                key: "Scene Replay",
                section: "Scene Replay",
                order: 30,
                component: ({ context }) => <SceneReplayTool scene={context} />,
            })
        );

        return {
            dispose: () => {
                contentRegistrations.forEach((registration) => registration.dispose());
            },
        };
    },
};
