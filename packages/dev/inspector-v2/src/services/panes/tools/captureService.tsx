import type { ServiceDefinition } from "./../../../modularity/serviceDefinition";
import { ToolsServiceIdentity } from "./toolsService";
import type { IToolsService } from "./toolsService";
import { CaptureScreenshotProperties } from "../../../components/tools/capture/captureScreenshotProperties";
import { Scene } from "core/scene";
import type { IDisposable } from "core/scene";
import { CaptureRttProperties } from "../../../components/tools/capture/captureRttProperties";
import { GifPane } from "../../../components/tools/capture/captureGifProperties";
import { CaptureReplayProperties } from "../../../components/tools/capture/captureReplayProperties";

export const CaptureScreenshotSectionIdentity = Symbol("Capture Screenshot");
export const CaptureRttSectionIdentity = Symbol("Capture RTT");
export const CaptureGifSectionIdentity = Symbol("Capture GIF");
export const CaptureReplaySectionIdentity = Symbol("Capture Replay");

export const CaptureServiceDefinition: ServiceDefinition<[], [IToolsService]> = {
    friendlyName: "Capture Tools",
    consumes: [ToolsServiceIdentity],
    factory: (toolsService) => {
        // Create sections for each capture tool
        const screenshotSectionRegistration = toolsService.addSection({
            order: 0,
            identity: CaptureScreenshotSectionIdentity,
        });

        const rttSectionRegistration = toolsService.addSection({
            order: 1,
            identity: CaptureRttSectionIdentity,
        });

        const gifSectionRegistration = toolsService.addSection({
            order: 2,
            identity: CaptureGifSectionIdentity,
        });

        const replaySectionRegistration = toolsService.addSection({
            order: 3,
            identity: CaptureReplaySectionIdentity,
        });

        const contentRegistrations: IDisposable[] = [];

        // Screenshot capture content
        contentRegistrations.push(
            toolsService.addSectionContent({
                key: "Screenshot Capture",
                predicate: (entity: unknown) => entity instanceof Scene,
                content: [
                    {
                        section: CaptureScreenshotSectionIdentity,
                        order: 0,
                        component: ({ context }) => <CaptureScreenshotProperties scene={context} />,
                    },
                ],
            })
        );

        // RTT capture content
        contentRegistrations.push(
            toolsService.addSectionContent({
                key: "RTT Capture",
                predicate: (entity: unknown) => entity instanceof Scene,
                content: [
                    {
                        section: CaptureRttSectionIdentity,
                        order: 0,
                        component: ({ context }) => <CaptureRttProperties scene={context} />,
                    },
                ],
            })
        );

        // GIF capture content
        contentRegistrations.push(
            toolsService.addSectionContent({
                key: "GIF Capture",
                predicate: (entity: unknown) => entity instanceof Scene,
                content: [
                    {
                        section: CaptureGifSectionIdentity,
                        order: 0,
                        component: ({ context }) => <GifPane scene={context} />,
                    },
                ],
            })
        );

        // Replay capture content
        contentRegistrations.push(
            toolsService.addSectionContent({
                key: "Replay Capture",
                predicate: (entity: unknown) => entity instanceof Scene,
                content: [
                    {
                        section: CaptureReplaySectionIdentity,
                        order: 0,
                        component: ({ context }) => <CaptureReplayProperties scene={context} />,
                    },
                ],
            })
        );

        return {
            dispose: () => {
                contentRegistrations.forEach((registration) => registration.dispose());
                screenshotSectionRegistration.dispose();
                rttSectionRegistration.dispose();
                gifSectionRegistration.dispose();
                replaySectionRegistration.dispose();
            },
        };
    },
};

export default {
    serviceDefinitions: [CaptureServiceDefinition],
} as const;
