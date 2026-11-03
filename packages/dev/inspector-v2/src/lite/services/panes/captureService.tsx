import { CameraRegular, RecordRegular, RecordStopRegular, WrenchRegular } from "@fluentui/react-icons";
import { type FunctionComponent, useCallback, useRef } from "react";

import { ButtonLine } from "shared-ui-components/fluent/hoc/buttonLine";
import { NumberDropdownPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/dropdownPropertyLine";
import { PropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/propertyLine";
import { Accordion, AccordionSection } from "shared-ui-components/fluent/primitives/accordion";
import { MessageBar } from "shared-ui-components/fluent/primitives/messageBar";
import { ToggleButton } from "shared-ui-components/fluent/primitives/toggleButton";
import { useObservableState } from "shared-ui-components/modularTool/hooks/observableHooks";
import { UXContextProvider } from "shared-ui-components/modularTool/components/uxContextProvider";
import { type ServiceDefinition } from "shared-ui-components/modularTool/modularity/serviceDefinition";
import { type IShellService, ShellServiceIdentity } from "shared-ui-components/modularTool/services/shellService";

import { type IWatcherService, WatcherServiceIdentity } from "../../../services/watcherService";
import { type IEngineContext, EngineContextIdentity } from "../../engineContext";
import { CaptureController } from "./captureController";

const CaptureTools: FunctionComponent<{ controller: CaptureController; engineContext: IEngineContext }> = (props) => {
    const { controller, engineContext } = props;
    const { engine } = engineContext;
    const videoLine = useRef<HTMLDivElement>(null);
    const state = useObservableState(
        useCallback(
            () => ({ surface: controller.surface, pending: controller.pending, recording: controller.recording, error: controller.error, surfaces: engine.surfaces.slice() }),
            [controller, engine]
        ),
        controller.onChanged
    );
    return (
        <Accordion uniqueId="Lite Tools" enableSearchItems enablePinnedItems enableHiddenItems>
            <AccordionSection title="Capture">
                <NumberDropdownPropertyLine
                    label="Surface"
                    value={state.surfaces.indexOf(state.surface)}
                    options={state.surfaces.map((surface, index) => ({
                        value: index,
                        label: index === 0 ? "Primary Surface" : `Surface ${index}: ${"id" in surface.canvas && surface.canvas.id ? surface.canvas.id : "Canvas"}`,
                    }))}
                    disabled={state.pending || state.recording}
                    onChange={(index) => controller.selectSurface(state.surfaces[index])}
                />
                <MessageBar intent="info" message="Captures the presented canvas at its native resolution, without HTML overlays. Screenshots require a running render loop." />
                <ButtonLine
                    uniqueId="Capture Screenshot"
                    label={state.pending && !state.recording ? "Capturing Screenshot..." : "Capture Screenshot"}
                    icon={CameraRegular}
                    disabled={state.pending || state.recording}
                    onClick={(event) => void controller.screenshotAsync(event!.currentTarget.ownerDocument)}
                />
                <PropertyLine ref={videoLine} label="Record Video">
                    <ToggleButton
                        title={state.recording ? "Stop Recording" : "Record Video"}
                        value={state.recording}
                        checkedIcon={RecordStopRegular}
                        uncheckedIcon={RecordRegular}
                        disabled={state.pending || !controller.canRecord}
                        onChange={(recording) => (recording ? controller.startRecording(videoLine.current!.ownerDocument) : controller.stopRecording())}
                    />
                </PropertyLine>
                {!controller.canRecord ? (
                    <MessageBar intent="info" message="Video recording requires an HTML canvas and browser support for MediaRecorder and captureStream." />
                ) : null}
                {state.error ? <MessageBar title="Capture Error" intent="error" message={state.error} /> : null}
            </AccordionSection>
        </Accordion>
    );
};

export const CaptureServiceDefinition: ServiceDefinition<[], [IEngineContext, IShellService, IWatcherService]> = {
    friendlyName: "Babylon Lite Capture Tools",
    consumes: [EngineContextIdentity, ShellServiceIdentity, WatcherServiceIdentity],
    factory: (engineContext, shellService, watcherService) => {
        const controller = new CaptureController(engineContext.engine);
        const watcher = watcherService.watchValue(
            () => engineContext.engine.surfaces.slice(),
            () => controller.refreshSurfaces(),
            (left, right) => left.length === right.length && left.every((surface, index) => surface === right[index])
        );
        const registration = shellService.addSidePane({
            key: "Tools",
            title: "Tools",
            icon: WrenchRegular,
            horizontalLocation: "right",
            verticalLocation: "top",
            order: 400,
            teachingMoment: false,
            content: () => (
                <UXContextProvider>
                    <CaptureTools controller={controller} engineContext={engineContext} />
                </UXContextProvider>
            ),
        });
        return {
            dispose: () => {
                controller.dispose();
                watcher.dispose();
                registration.dispose();
            },
        };
    },
};
