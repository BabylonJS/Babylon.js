import { BugRegular } from "@fluentui/react-icons";
import { type FunctionComponent, useCallback } from "react";

import { NumberDropdownPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/dropdownPropertyLine";
import { SwitchPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/switchPropertyLine";
import { Accordion, AccordionSection } from "shared-ui-components/fluent/primitives/accordion";
import { MessageBar } from "shared-ui-components/fluent/primitives/messageBar";
import { useObservableState } from "shared-ui-components/modularTool/hooks/observableHooks";
import { UXContextProvider } from "shared-ui-components/modularTool/components/uxContextProvider";
import { type ServiceDefinition } from "shared-ui-components/modularTool/modularity/serviceDefinition";
import { type IShellService, ShellServiceIdentity } from "shared-ui-components/modularTool/services/shellService";

import { type IWatcherService, WatcherServiceIdentity } from "../../../services/watcherService";
import { type IEngineContext, EngineContextIdentity } from "../../engineContext";
import { DebugController } from "./debugController";

const DebugPane: FunctionComponent<{ controller: DebugController }> = (props) => {
    const { controller } = props;
    const state = useObservableState(
        useCallback(
            () => ({ scenes: controller.scenes, scene: controller.scene, grid: controller.gridEnabled, bounds: controller.boundsEnabled, error: controller.error }),
            [controller]
        ),
        controller.onChanged
    );
    return (
        <Accordion uniqueId="Lite Debug" enableSearchItems enablePinnedItems enableHiddenItems>
            <AccordionSection title="Helpers">
                {!state.scenes.length ? (
                    <MessageBar intent="info" message="Register a scene to use debug helpers." />
                ) : (
                    <>
                        <NumberDropdownPropertyLine
                            label="Scene"
                            value={state.scenes.findIndex((scene) => scene === state.scene)}
                            options={state.scenes.map((scene, index) => ({ label: `${index + 1}: ${scene.name || "Scene"}`, value: index }))}
                            onChange={(index) => controller.selectScene(state.scenes[index])}
                        />
                        <SwitchPropertyLine
                            label="Ground Grid"
                            ariaLabel="Ground Grid"
                            description="Show a 100-unit ground grid at the scene origin."
                            value={state.grid}
                            onChange={(value) => controller.setGrid(value)}
                        />
                        <SwitchPropertyLine
                            label="Bounding Boxes"
                            ariaLabel="Bounding Boxes"
                            description="Show mesh-local bounds that follow transforms every frame. Geometry and visibility updates follow Inspector's watch mode; deformations and individual thin instances are not included."
                            value={state.bounds}
                            onChange={(value) => controller.setBounds(value)}
                        />
                    </>
                )}
                {state.error ? <MessageBar title="Debug Error" intent="error" message={state.error} /> : null}
            </AccordionSection>
        </Accordion>
    );
};

export const DebugServiceDefinition: ServiceDefinition<[], [IEngineContext, IShellService, IWatcherService]> = {
    friendlyName: "Babylon Lite Debug",
    consumes: [EngineContextIdentity, ShellServiceIdentity, WatcherServiceIdentity],
    factory: (engineContext, shellService, watcherService) => {
        const controller = new DebugController(engineContext.engine);
        const watcher = watcherService.watchValue(
            () => controller.getSnapshot(),
            () => controller.refresh(),
            (left, right) => left.length === right.length && left.every((value, index) => value === right[index])
        );
        const registration = shellService.addSidePane({
            key: "Debug",
            title: "Debug",
            icon: BugRegular,
            horizontalLocation: "right",
            verticalLocation: "top",
            order: 200,
            teachingMoment: false,
            content: () => (
                <UXContextProvider>
                    <DebugPane controller={controller} />
                </UXContextProvider>
            ),
        });
        return {
            dispose: () => {
                watcher.dispose();
                controller.dispose();
                registration.dispose();
            },
        };
    },
};
