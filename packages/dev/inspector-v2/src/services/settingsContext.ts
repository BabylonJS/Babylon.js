import type { IReadonlyObservable } from "core/Misc/observable";
import type { IService } from "../modularity/serviceDefinition";

export const SettingsContextIdentity = Symbol("SettingsContext");

/**
 * SettingsContext provides a set of settings used across the inspector.
 */
export interface ISettingsContext extends IService<typeof SettingsContextIdentity> {
    /**
     * Use degrees instead of radians for angles.
     */
    useDegrees: boolean;

    /**
     * Ignore backfaces when picking.
     */
    ignoreBackfacesForPicking: boolean;

    /**
     * Shows the Properties pane when an entity is selected.
     */
    showPropertiesOnEntitySelection: boolean;

    /**
     * Observable that fires whenever a setting changes.
     */
    readonly settingsChangedObservable: IReadonlyObservable<ISettingsContext>;
}
