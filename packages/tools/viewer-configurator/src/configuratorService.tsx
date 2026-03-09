import type { ServiceDefinition } from "inspector/modularity/serviceDefinition";
import type { IShellService } from "inspector/services/shellService";

import { ShellServiceIdentity } from "inspector/services/shellService";
import { SettingsRegular } from "@fluentui/react-icons";
import { useObservableState } from "inspector/hooks/observableHooks";

import type { IViewerService } from "./viewerService";
import { ViewerServiceIdentity } from "./viewerService";
import { Configurator } from "./components/configurator/configurator";

export const ConfiguratorServiceDefinition: ServiceDefinition<[], [IShellService, IViewerService]> = {
    friendlyName: "Configurator Service",
    consumes: [ShellServiceIdentity, ViewerServiceIdentity],
    factory: (shellService, viewerService) => {
        const registration = shellService.addSidePane({
            key: "Configurator",
            title: "Viewer Configurator",
            icon: SettingsRegular,
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

        return {
            dispose: () => registration.dispose(),
        };
    },
};
