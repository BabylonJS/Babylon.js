import type { IDisposable, IReadonlyObservable, Nullable } from "core/index";
import type { IService, ServiceDefinition } from "../modularity/serviceDefinition";
import type { ISettingsContext } from "./settingsContext";
import type { IShellService } from "./shellService";

import { Observable } from "core/Misc/observable";
import { InterceptFunction } from "../instrumentation/functionInstrumentation";
import { SettingsContextIdentity } from "./settingsContext";
import { ShellServiceIdentity } from "./shellService";

export const SelectionServiceIdentity = Symbol("PropertiesService");

/**
 * Tracks the currently selected entity.
 */
export interface ISelectionService extends IService<typeof SelectionServiceIdentity> {
    /**
     * Gets or sets the currently selected entity.
     */
    selectedEntity: Nullable<unknown>;

    /**
     * An observable that notifies when the selected entity changes.
     */
    readonly onSelectedEntityChanged: IReadonlyObservable<void>;
}

export const SelectionServiceDefinition: ServiceDefinition<[ISelectionService], [IShellService, ISettingsContext]> = {
    friendlyName: "Selection Service",
    produces: [SelectionServiceIdentity],
    consumes: [ShellServiceIdentity, SettingsContextIdentity],
    factory: (shellService, settingsContext) => {
        let selectedEntityState: Nullable<unknown> = null;
        const selectedEntityObservable = new Observable<void>();
        let disposedHook: Nullable<IDisposable> = null;

        const setSelectedItem = (item: Nullable<unknown>) => {
            if (item !== selectedEntityState) {
                disposedHook?.dispose();
                disposedHook = null;

                selectedEntityState = item;
                selectedEntityObservable.notifyObservers();

                if (item) {
                    const disposable = item as Partial<IDisposable>;
                    if (disposable.dispose) {
                        disposedHook = InterceptFunction(disposable, "dispose", { afterCall: () => setSelectedItem(null) });
                    }
                }

                // Expose the selected entity through a global variable. This is an Inspector v1 feature that people have found useful.
                (globalThis as any).debugNode = item;

                // Automatically open the properties pane when an entity is selected.
                if (item && settingsContext.showPropertiesOnEntitySelection) {
                    shellService.sidePanes.find((pane) => pane.key === "Properties")?.select();
                }
            }
        };

        return {
            get selectedEntity() {
                return selectedEntityState;
            },
            set selectedEntity(item: Nullable<unknown>) {
                setSelectedItem(item);
            },
            onSelectedEntityChanged: selectedEntityObservable,
            dispose: () => selectedEntityObservable.clear(),
        };
    },
};
