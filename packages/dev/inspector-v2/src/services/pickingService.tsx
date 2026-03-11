import type { Nullable } from "core/index";
import type { ServiceDefinition } from "../modularity/serviceDefinition";
import type { IGizmoService } from "./gizmoService";
import type { ISettingsService } from "./panes/settingsService";
import type { ISceneContext } from "./sceneContext";
import type { ISelectionService } from "./selectionService";
import type { SettingDescriptor } from "./settingsStore";
import type { IShellService } from "./shellService";

import { useCallback } from "react";
import { SwitchPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/switchPropertyLine";
import { PickingToolbar } from "../components/pickingToolbar";
import { useObservableState } from "../hooks/observableHooks";
import { useSetting } from "../hooks/settingsHooks";
import { GizmoServiceIdentity } from "./gizmoService";
import { HighlightSelectedEntitySettingDescriptor } from "./highlightService";
import { SettingsServiceIdentity } from "./panes/settingsService";
import { SceneContextIdentity } from "./sceneContext";
import { SelectionServiceIdentity } from "./selectionService";
import { ShellServiceIdentity } from "./shellService";

const IgnoreBackfacesForPickingSettingDescriptor: SettingDescriptor<boolean> = {
    key: "IgnoreBackfacesForPicking",
    defaultValue: false,
};

export const PickingServiceDefinition: ServiceDefinition<[], [ISceneContext, IShellService, ISelectionService, IGizmoService, ISettingsService]> = {
    friendlyName: "Picking Service",
    consumes: [SceneContextIdentity, ShellServiceIdentity, SelectionServiceIdentity, GizmoServiceIdentity, SettingsServiceIdentity],
    factory: (sceneContext, shellService, selectionService, gizmoService, settingsService) => {
        const settingRegistration = settingsService.addSectionContent({
            key: "Picking Service Settings",
            section: "Scene",
            component: () => {
                const [ignoreBackfacesForPicking, setIgnoreBackfacesForPicking] = useSetting(IgnoreBackfacesForPickingSettingDescriptor);
                const [highlightSelectedEntity, setHighlightSelectedEntity] = useSetting(HighlightSelectedEntitySettingDescriptor);

                return (
                    <>
                        <SwitchPropertyLine
                            label="Ignore Backfaces for Picking"
                            description="Ignore backfaces when picking."
                            value={ignoreBackfacesForPicking}
                            onChange={(checked) => {
                                setIgnoreBackfacesForPicking(checked);
                            }}
                        />
                        <SwitchPropertyLine
                            label="Highlight Selected Entity"
                            description="Highlight the selected entity."
                            value={highlightSelectedEntity}
                            onChange={(checked) => {
                                setHighlightSelectedEntity(checked);
                            }}
                        />
                    </>
                );
            },
        });

        const toolBarItemRegistration = shellService.addToolbarItem({
            key: "Picking Service",
            verticalLocation: "top",
            horizontalLocation: "left",
            teachingMoment: false,
            component: () => {
                const scene = useObservableState(() => sceneContext.currentScene, sceneContext.currentSceneObservable);
                const selectEntity = useCallback((entity: Nullable<object>) => (selectionService.selectedEntity = entity), []);
                const [ignoreBackfacesForPicking] = useSetting(IgnoreBackfacesForPickingSettingDescriptor);
                const [highlightSelectedEntity, setHighlightSelectedEntity] = useSetting(HighlightSelectedEntitySettingDescriptor);
                return scene ? (
                    <PickingToolbar
                        scene={scene}
                        selectEntity={selectEntity}
                        gizmoService={gizmoService}
                        ignoreBackfaces={ignoreBackfacesForPicking}
                        highlightSelectedEntity={highlightSelectedEntity}
                        onHighlightSelectedEntityChange={setHighlightSelectedEntity}
                    />
                ) : null;
            },
        });

        return {
            dispose: () => {
                settingRegistration.dispose();
                toolBarItemRegistration.dispose();
            },
        };
    },
};
