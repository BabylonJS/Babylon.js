import type { IEditablePropertyOption } from "core/Decorators/nodeDecorator";
import type { StateManager } from "./stateManager";

/**
 * Function used to force a rebuild of the node system
 * @param source source object
 * @param stateManager defines the state manager to use
 * @param propertyName name of the property that has been changed
 * @param notifiers list of notifiers to use
 * @param forceUpdate defines if we should force a react update
 */
export function ForceRebuild(source: any, stateManager: StateManager, propertyName: string, notifiers?: IEditablePropertyOption["notifiers"], forceUpdate = false) {
    if (notifiers?.onValidation && !notifiers?.onValidation(source, propertyName)) {
        return;
    }

    if (!notifiers || notifiers.update) {
        stateManager.onUpdateRequiredObservable.notifyObservers(source);
    }

    if (!notifiers || notifiers.rebuild) {
        stateManager.onRebuildRequiredObservable.notifyObservers();
    } else if (forceUpdate) {
        stateManager.onForceUpdatePropertiesObservable.notifyObservers();
    }

    if (notifiers?.activatePreviewCommand) {
        stateManager.onPreviewCommandActivated.notifyObservers(true);
    }

    if (stateManager.getScene) {
        const rebuild = notifiers?.callback?.(stateManager.getScene(), source) ?? false;

        if (rebuild) {
            stateManager.onRebuildRequiredObservable.notifyObservers();
        }
    }
}
