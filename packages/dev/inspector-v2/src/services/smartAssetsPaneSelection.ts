import { Observable, type Observer } from "core/Misc/observable";

const OnSmartAssetsPaneSelectionRequestedObservable = new Observable<void>(undefined, true);

/**
 * Requests that Inspector select the Smart Assets pane when it is available.
 */
export function SelectSmartAssetsPane(): void {
    OnSmartAssetsPaneSelectionRequestedObservable.notifyObservers();
}

/**
 * Adds an observer for Smart Assets pane selection requests.
 * @param callback - The callback to run when Smart Assets should be selected.
 * @returns The observer registration.
 */
export function AddSmartAssetsPaneSelectionObserver(callback: () => void): Observer<void> | null {
    return OnSmartAssetsPaneSelectionRequestedObservable.add(callback);
}

/**
 * Clears any cached Smart Assets pane selection request once it has been handled.
 */
export function ClearSmartAssetsPaneSelectionRequest(): void {
    OnSmartAssetsPaneSelectionRequestedObservable.notifyIfTriggered = false;
    OnSmartAssetsPaneSelectionRequestedObservable.cleanLastNotifiedState();
}

/**
 * Re-enables caching of Smart Assets pane selection requests while the pane service is unavailable.
 */
export function EnableSmartAssetsPaneSelectionRequestCache(): void {
    OnSmartAssetsPaneSelectionRequestedObservable.notifyIfTriggered = true;
}
