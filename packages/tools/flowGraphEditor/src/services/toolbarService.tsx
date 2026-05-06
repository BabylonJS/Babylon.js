import { type IDisposable } from "core/index";
import { useCallback } from "react";

import { type ServiceDefinition } from "shared-ui-components/modularTool/modularity/serviceDefinition";
import { type IShellService, ShellServiceIdentity } from "shared-ui-components/modularTool/services/shellService";
import { Button } from "shared-ui-components/fluent/primitives/button";

import { CodeRegular, QuestionCircleRegular } from "@fluentui/react-icons";

import { type IGlobalStateService, GlobalStateServiceIdentity } from "./globalStateService";

/**
 * Adds the Help and How-to-Use buttons to the bottom-right toolbar slot of the shell.
 *
 * The button click handlers fire `globalState.onHelpRequested` / `onHowToUseRequested`,
 * which the central content's `<GraphEditor>` listens to in order to mount the
 * existing `HelpDialogComponent` and `HowToUseDialogComponent` overlays.
 */
export const ToolbarServiceDefinition: ServiceDefinition<[], [IShellService, IGlobalStateService]> = {
    friendlyName: "Toolbar Service",
    consumes: [ShellServiceIdentity, GlobalStateServiceIdentity],
    factory: (shellService, globalStateService) => {
        const helpRegistration = shellService.addToolbarItem({
            key: "FlowGraphHelp",
            horizontalLocation: "right",
            verticalLocation: "bottom",
            teachingMoment: false,
            component: () => {
                const onClick = useCallback(() => {
                    globalStateService.globalState.onHelpRequested.notifyObservers(undefined);
                }, []);
                return <Button title="Help" appearance="transparent" icon={QuestionCircleRegular} onClick={onClick} />;
            },
        });

        const howToUseRegistration = shellService.addToolbarItem({
            key: "FlowGraphHowToUse",
            horizontalLocation: "right",
            verticalLocation: "bottom",
            teachingMoment: false,
            component: () => {
                const onClick = useCallback(() => {
                    globalStateService.globalState.onHowToUseRequested.notifyObservers();
                }, []);
                return <Button title="How to Use (embed code samples)" appearance="transparent" icon={CodeRegular} onClick={onClick} />;
            },
        });

        return {
            dispose: () => {
                helpRegistration.dispose();
                howToUseRegistration.dispose();
            },
        } satisfies IDisposable;
    },
};
