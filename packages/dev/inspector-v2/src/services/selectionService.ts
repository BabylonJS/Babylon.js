// eslint-disable-next-line import/no-internal-modules
import type { Nullable } from "core/index";

import type { IService, ServiceDefinition } from "../modularity/serviceDefinition";

import { Observable } from "core/Misc/observable";

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
    readonly onSelectedEntityChanged: Observable<void>;
}

export const SelectionServiceDefinition: ServiceDefinition<[ISelectionService], []> = {
    friendlyName: "Selection Service",
    produces: [SelectionServiceIdentity],
    factory: () => {
        let selectedEntityState: Nullable<unknown> = null;
        const selectedEntityObservable = new Observable<void>();
        const setSelectedItem = (item: Nullable<unknown>) => {
            if (item !== selectedEntityState) {
                selectedEntityState = item;
                selectedEntityObservable.notifyObservers();
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
