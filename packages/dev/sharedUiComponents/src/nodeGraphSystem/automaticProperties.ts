import type { IEditablePropertyOption } from "core/Decorators/nodeDecorator";
import type { StateManager } from "./stateManager";

/**
 * Function used to force a rebuild of the node system
 * @param source source object
 * @param stateManager defines the state manager to use
 * @param propertyName name of the property that has been changed
 * @param notifiers list of notifiers to use
 * @param engageActiveRefresh if active refresh should be engaged
 */
export function ForceRebuild(source: any, stateManager: StateManager, propertyName: string, notifiers?: IEditablePropertyOption["notifiers"], engageActiveRefresh = true) {
    if (notifiers?.onValidation && !notifiers?.onValidation(source, propertyName)) {
        return;
    }

    if (stateManager.getScene) {
        const rebuild = notifiers?.callback?.(stateManager.getScene(), source) ?? false;

        if (rebuild) {
            stateManager.onRebuildRequiredObservable.notifyObservers();
        }
    }

    if (!notifiers || notifiers.update) {
        stateManager.onUpdateRequiredObservable.notifyObservers(source);
    }

    if (!notifiers || notifiers.rebuild) {
        stateManager.onRebuildRequiredObservable.notifyObservers();
    }

    if (notifiers?.activatePreviewCommand) {
        stateManager.onPreviewCommandActivated.notifyObservers(true);
    }

    if (engageActiveRefresh && stateManager.activeNode) {
        for (const refresh of stateManager.activeNode._visualPropertiesRefresh) {
            refresh();
        }
    }
}
