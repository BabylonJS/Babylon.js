import { type ServiceDefinition } from "shared-ui-components/modularTool/modularity/serviceDefinition";
import { type IShellService, ShellServiceIdentity } from "shared-ui-components/modularTool/services/shellService";

import { QuestionCircleRegular } from "@fluentui/react-icons";
import { useObservableState } from "shared-ui-components/modularTool/hooks/observableHooks";
import { Button } from "shared-ui-components/fluent/primitives/button";
import { useCallback } from "react";

import { type IViewerService, ViewerServiceIdentity } from "./viewerService";
import { Configurator } from "./components/configurator/configurator";
import { BabylonLogo } from "./components/icons";

export const ConfiguratorServiceDefinition: ServiceDefinition<[], [IShellService, IViewerService]> = {
    friendlyName: "Configurator Service",
    consumes: [ShellServiceIdentity, ViewerServiceIdentity],
    factory: (shellService, viewerService) => {
        const sidePaneRegistration = shellService.addSidePane({
            key: "Configurator",
            title: "Viewer Configurator",
            icon: BabylonLogo,
            horizontalLocation: "right",
            verticalLocation: "top",
            teachingMoment: false,
            content: () => {
                const viewerElement = useObservableState(() => viewerService.viewerElement, viewerService.onStateChanged);
                const viewerOptions = useObservableState(() => viewerService.viewerOptions, viewerService.onStateChanged);
                const viewerDetails = useObservableState(() => viewerElement?.viewerDetails ?? undefined, viewerService.onStateChanged);
                const viewer = viewerDetails?.viewer;

                if (!viewerElement || !viewerOptions || !viewerDetails || !viewer) {
                    return null;
                }

                return <Configurator viewerOptions={viewerOptions} viewerElement={viewerElement} viewerDetails={viewerDetails} viewer={viewer} />;
            },
        });

        const toolbarRegistration = shellService.addToolbarItem({
            key: "Documentation",
            horizontalLocation: "right",
            verticalLocation: "bottom",
            teachingMoment: false,
            component: () => {
                const openDocumentation = useCallback(() => {
                    window.open("https://doc.babylonjs.com/toolsAndResources/viewerConfigurator");
                }, []);
                return <Button title="Documentation" appearance="transparent" icon={QuestionCircleRegular} onClick={openDocumentation} />;
            },
        });

        return {
            dispose: () => {
                sidePaneRegistration.dispose();
                toolbarRegistration.dispose();
            },
        };
    },
};
