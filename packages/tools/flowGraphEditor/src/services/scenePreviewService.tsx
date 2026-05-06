import { type IDisposable } from "core/index";

import { type ServiceDefinition } from "shared-ui-components/modularTool/modularity/serviceDefinition";
import { type IShellService, ShellServiceIdentity } from "shared-ui-components/modularTool/services/shellService";

import { VideoRegular } from "@fluentui/react-icons";

import { ScenePreviewComponent } from "../components/preview/scenePreviewComponent";
import { type IGlobalStateService, GlobalStateServiceIdentity } from "./globalStateService";

/**
 * Phase 2 (passthrough) side-pane service that hosts the legacy `ScenePreviewComponent` in
 * the shell's right (bottom) side pane. The component is rewritten in a later phase; for now
 * it is wrapped verbatim so the layout stays parity with the legacy editor.
 */
export const ScenePreviewServiceDefinition: ServiceDefinition<[], [IShellService, IGlobalStateService]> = {
    friendlyName: "Scene Preview Service",
    consumes: [ShellServiceIdentity, GlobalStateServiceIdentity],
    factory: (shellService, globalStateService) => {
        const registration = shellService.addSidePane({
            key: "FlowGraphScenePreview",
            title: "Scene Preview",
            icon: VideoRegular,
            horizontalLocation: "right",
            verticalLocation: "bottom",
            teachingMoment: false,
            content: () => <ScenePreviewComponent globalState={globalStateService.globalState} />,
        });

        return {
            dispose: () => {
                registration.dispose();
            },
        } satisfies IDisposable;
    },
};
