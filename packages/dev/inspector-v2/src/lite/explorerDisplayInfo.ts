import { Observable } from "core/Misc/observable";

import { type ExplorerDisplayInfo } from "../components/explorer/explorerModel";
import { type IWatcherService } from "../services/watcherService";

/**
 * Creates live display info for labels derived from relationships as well as names.
 * @param watcherService The service used to observe the derived label.
 * @param getDisplayName Gets the current label.
 * @returns Disposable display info that updates when the label changes.
 */
export function CreateWatchedDisplayInfo(watcherService: IWatcherService, getDisplayName: () => string): ExplorerDisplayInfo {
    const onChange = new Observable<void>();
    const watcher = watcherService.watchValue(getDisplayName, () => onChange.notifyObservers());
    return {
        get name() {
            return getDisplayName();
        },
        onChange,
        dispose: () => {
            watcher.dispose();
            onChange.clear();
        },
    };
}

/**
 * Creates live Explorer display info for an entity whose name is mutable.
 * @param watcherService The service used to observe name changes.
 * @param entity The named entity.
 * @param getDisplayName Gets the current display name, including any fallback.
 * @returns Disposable display info that updates when the entity name changes.
 */
export function CreateWatchedNameDisplayInfo<T extends { name?: string }>(watcherService: IWatcherService, entity: T, getDisplayName: () => string): ExplorerDisplayInfo {
    const onChange = new Observable<void>();
    const nameWatcher = watcherService.watchProperty(entity, "name", () => onChange.notifyObservers());

    return {
        get name() {
            return getDisplayName();
        },
        onChange,
        dispose: () => {
            nameWatcher.dispose();
            onChange.clear();
        },
    };
}
