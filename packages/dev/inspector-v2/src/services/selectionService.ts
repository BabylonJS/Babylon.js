// eslint-disable-next-line import/no-internal-modules
import type { IDisposable, IReadonlyObservable, Nullable } from "core/index";

import type { IService, ServiceDefinition } from "../modularity/serviceDefinition";

import { Observable } from "core/Misc/observable";
import { InterceptFunction } from "../instrumentation/functionInstrumentation";

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

export const SelectionServiceDefinition: ServiceDefinition<[ISelectionService], []> = {
    friendlyName: "Selection Service",
    produces: [SelectionServiceIdentity],
    factory: () => {
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
