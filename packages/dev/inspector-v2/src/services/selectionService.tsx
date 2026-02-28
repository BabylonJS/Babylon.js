import type { IDisposable, IReadonlyObservable, Nullable } from "core/index";
import type { IService, ServiceDefinition } from "../modularity/serviceDefinition";
import type { ISettingsService } from "./panes/settingsService";
import type { ISceneContext } from "./sceneContext";
import type { ISettingsStore, SettingDescriptor } from "./settingsStore";
import type { IShellService } from "./shellService";

import { Observable } from "core/Misc/observable";
import { SwitchPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/switchPropertyLine";
import { useSetting } from "../hooks/settingsHooks";
import { InterceptFunction } from "../instrumentation/functionInstrumentation";
import { SettingsServiceIdentity } from "./panes/settingsService";
import { SceneContextIdentity } from "./sceneContext";
import { SettingsStoreIdentity } from "./settingsStore";
import { ShellServiceIdentity } from "./shellService";

export const SelectionServiceIdentity = Symbol("PropertiesService");

/**
 * Tracks the currently selected entity.
 */
export interface ISelectionService extends IService<typeof SelectionServiceIdentity> {
    /**
     * Gets or sets the currently selected entity.
     */
    selectedEntity: Nullable<object>;

    /**
     * An observable that notifies when the selected entity changes.
     */
    readonly onSelectedEntityChanged: IReadonlyObservable<void>;
}

const ShowPropertiesOnSelectionSettingDescriptor: SettingDescriptor<boolean> = {
    key: "ShowPropertiesOnSelection",
    defaultValue: true,
};

export const SelectionServiceDefinition: ServiceDefinition<[ISelectionService], [IShellService, ISettingsStore, ISettingsService, ISceneContext]> = {
    friendlyName: "Selection Service",
    produces: [SelectionServiceIdentity],
    consumes: [ShellServiceIdentity, SettingsStoreIdentity, SettingsServiceIdentity, SceneContextIdentity],
    factory: (shellService, settingsStore, settingsService, sceneContext) => {
        settingsService.addSectionContent({
            key: "Selection Service Settings",
            section: "UI",
            component: () => {
                const [showPropertiesOnEntitySelection, setShowPropertiesOnEntitySelection] = useSetting(ShowPropertiesOnSelectionSettingDescriptor);

                return (
                    <SwitchPropertyLine
                        label="Show Properties on Selection"
                        description="Automatically open the properties pane when an entity is selected."
                        value={showPropertiesOnEntitySelection}
                        onChange={(checked) => {
                            setShowPropertiesOnEntitySelection(checked);
                        }}
                    />
                );
            },
        });

        let selectedEntityState: Nullable<object> = null;
        const selectedEntityObservable = new Observable<void>();
        let disposedHook: Nullable<IDisposable> = null;

        const setSelectedItem = (item: Nullable<object>) => {
            if (item !== selectedEntityState) {
                disposedHook?.dispose();
                disposedHook = null;

                selectedEntityState = item;
                selectedEntityObservable.notifyObservers();

                if (item) {
                    const disposable = item as Partial<IDisposable>;
                    if (typeof disposable.dispose === "function") {
                        disposedHook = InterceptFunction(disposable, "dispose", { afterCall: () => setSelectedItem(null) });
                    }
                }

                // Expose the selected entity through a global variable. This is an Inspector v1 feature that people have found useful.
                (globalThis as Record<string, unknown>).debugNode = item;

                // Automatically open the properties pane when an entity is selected.
                if (item && settingsStore.readSetting(ShowPropertiesOnSelectionSettingDescriptor)) {
                    shellService.sidePanes.find((pane) => pane.key === "Properties")?.select();
                }
            }
        };

        // Set the scene as the default selected entity.
        setSelectedItem(sceneContext.currentScene);

        return {
            get selectedEntity() {
                return selectedEntityState;
            },
            set selectedEntity(item: Nullable<object>) {
                setSelectedItem(item);
            },
            onSelectedEntityChanged: selectedEntityObservable,
            dispose: () => selectedEntityObservable.clear(),
        };
    },
};
