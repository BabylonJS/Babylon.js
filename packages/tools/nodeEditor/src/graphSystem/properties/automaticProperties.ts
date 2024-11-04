import type { IEditablePropertyOption } from "core/Decorators/nodeDecorator";
import type { StateManager } from "shared-ui-components/nodeGraphSystem/stateManager";

/**
 * Function used to force a rebuild of the node system
 * @param propertyName name of the property that has been changed
 * @param notifiers list of notifiers to use
 */
export function ForceRebuild(source: any, stateManager: StateManager, propertyName: string, notifiers?: IEditablePropertyOption["notifiers"]) {
    if (notifiers?.onValidation && !notifiers?.onValidation(source, propertyName)) {
        return;
    }

    if (!notifiers || notifiers.update) {
        stateManager.onUpdateRequiredObservable.notifyObservers(source);
    }

    if (!notifiers || notifiers.rebuild) {
        stateManager.onRebuildRequiredObservable.notifyObservers();
    }

    if (notifiers?.activatePreviewCommand) {
        (stateManager.data as GlobalState).onPreviewCommandActivated.notifyObservers(true);
    }

    const rebuild = notifiers?.callback?.((this.props.stateManager.data as GlobalState).nodeMaterial.getScene(), source) ?? false;

    if (rebuild) {
        stateManager.onRebuildRequiredObservable.notifyObservers();
    }
}
