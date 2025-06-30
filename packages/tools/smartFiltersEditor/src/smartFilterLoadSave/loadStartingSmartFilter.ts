import type { ThinEngine } from "core/Engines/thinEngine";
import type { Observable } from "core/Misc/observable";
import type { SmartFilter, SmartFilterDeserializer } from "smart-filters";
import { CreateDefaultSmartFilter } from "../defaultSmartFilter";
import type { Nullable } from "core/types";
import { GetSnippet, SetSnippet } from "./hashFunctions";
import { LoadSmartFilterFromSnippetServer } from "./loadSmartFilterFromSnippetServer";
import { LogEntry } from "smart-filters-editor-control";

/**
 * Loads the starting Smart Filter for this session, consulting the URL first, and if
 * there isn't a snippet on the URL, loads a default Smart Filter.
 *
 * @param smartFilterDeserializer - SmartFilterDeserializer to use
 * @param engine - ThinEngine to use
 * @param onLogRequiredObservable - Observable that will be called when a log is required
 * @returns Promise that resolves with the loaded Smart Filter
 */
export async function LoadStartingSmartFilter(
    smartFilterDeserializer: SmartFilterDeserializer,
    engine: ThinEngine,
    onLogRequiredObservable: Observable<LogEntry>
): Promise<SmartFilter> {
    const smartFilterFromUrl = await LoadFromUrl(smartFilterDeserializer, engine, onLogRequiredObservable);
    if (smartFilterFromUrl) {
        return smartFilterFromUrl;
    }

    onLogRequiredObservable.notifyObservers(new LogEntry("Loaded default Smart Filter", false));
    return CreateDefaultSmartFilter();
}

/**
 * Checks the hash for a snippet token and loads the Smart Filter if one is found.
 * Otherwise, loads the last in-repo Smart Filter or the default.
 * @param smartFilterDeserializer - SmartFilterDeserializer to use
 * @param engine - ThinEngine to use
 * @param onLogRequiredObservable - Observable that will be called when a log is required
 * @returns Promise that resolves with the loaded Smart Filter, or null if no Smart Filter was loaded
 */
export async function LoadFromUrl(
    smartFilterDeserializer: SmartFilterDeserializer,
    engine: ThinEngine,
    onLogRequiredObservable: Observable<LogEntry>
): Promise<Nullable<SmartFilter>> {
    const [snippetToken, version] = GetSnippet();

    if (snippetToken) {
        try {
            // Reset hash with our formatting to keep it looking consistent
            SetSnippet(snippetToken, version, false);
            const smartFilter = await LoadSmartFilterFromSnippetServer(smartFilterDeserializer, engine, snippetToken, version);
            onLogRequiredObservable.notifyObservers(new LogEntry("Loaded Smart Filter from unique URL", false));
            return smartFilter;
        } catch (err) {
            onLogRequiredObservable.notifyObservers(new LogEntry(`Could not load Smart Filter from snippet server:\n${err}`, true));
        }
    }
    return null;
}
