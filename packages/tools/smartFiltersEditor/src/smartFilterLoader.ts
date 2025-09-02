import type { ThinEngine } from "core/Engines/thinEngine";
import type { SmartFilter, SmartFilterDeserializer } from "smart-filters";
import type { SmartFilterRenderer } from "./smartFilterRenderer";
import { Observable } from "core/Misc/observable";
import { ReadFile } from "core/Misc/fileTools";

/**
 * Indicates the source of a Smart Filter
 */
export enum SmartFilterSource {
    /**
     * The Smart Filter was loaded from the snippet server
     */
    Snippet,

    /**
     * The Smart Filter was loaded from a JSON file
     */
    File,
}

/**
 * Data for the onSmartFilterLoadedObservable event
 */
export type SmartFilterLoadedEvent = {
    /**
     * The loaded Smart Filter
     */
    smartFilter: SmartFilter;

    /**
     * The source of the Smart Filter
     */
    source: SmartFilterSource;
};

/**
 * Manges loading Smart Filters for the demo app
 */
export class SmartFilterLoader {
    private readonly _engine: ThinEngine;
    private readonly _renderer: SmartFilterRenderer;

    /**
     * The SmartFilterDeserializer used to deserialize Smart Filters
     */
    public readonly smartFilterDeserializer: SmartFilterDeserializer;

    /**
     * The URL of the snippet server
     */
    public readonly snippetUrl = "https://snippet.babylonjs.com";

    /**
     * Observable that notifies when a Smart Filter has been loaded
     */
    public readonly onSmartFilterLoadedObservable: Observable<SmartFilterLoadedEvent>;

    /**
     * Creates a new SmartFilterLoader
     * @param engine - The ThinEngine to use
     * @param renderer - The SmartFilterRenderer to use
     * @param smartFilterDeserializer - The SmartFilterDeserializer to use
     */
    constructor(engine: ThinEngine, renderer: SmartFilterRenderer, smartFilterDeserializer: SmartFilterDeserializer) {
        this._engine = engine;
        this._renderer = renderer;
        this.onSmartFilterLoadedObservable = new Observable<SmartFilterLoadedEvent>();
        this.smartFilterDeserializer = smartFilterDeserializer;
    }

    /**
     * Loads a Smart Filter from the provided file.
     * @param file - File object to load from
     * @returns Promise that resolves with the loaded Smart Filter
     */
    public async loadFromFileAsync(file: File): Promise<SmartFilter> {
        const smartFilter = await this._loadSmartFilterAsync(async () => {
            // Await (data)
            const data = await new Promise<string>((resolve, reject) => {
                ReadFile(
                    file,
                    (data) => resolve(data),
                    undefined,
                    false,
                    (error) => reject(error)
                );
            });
            const smartFilter = await this.smartFilterDeserializer.deserialize(this._engine, JSON.parse(data));
            return smartFilter;
        }, SmartFilterSource.File);
        return smartFilter;
    }

    /**
     * Loads a Smart Filter from the snippet server.
     * @param snippetToken - Snippet token to load
     * @param version - Version of the snippet to load
     * @returns Promise that resolves with the loaded Smart Filter
     */
    public async loadFromSnippetAsync(snippetToken: string, version: string | undefined): Promise<SmartFilter> {
        const smartFilter = await this._loadSmartFilterAsync(async () => {
            const response = await fetch(`${this.snippetUrl}/${snippetToken}/${version || ""}`);

            if (!response.ok) {
                throw new Error(`Could not fetch snippet ${snippetToken}. Response was: ${response.statusText}`);
            }

            const data = await response.json();
            const snippet = JSON.parse(data.jsonPayload);
            const serializedSmartFilter = JSON.parse(snippet.smartFilter);

            const smartFilter = await this.smartFilterDeserializer.deserialize(this._engine, serializedSmartFilter);
            return smartFilter;
        }, SmartFilterSource.Snippet);
        return smartFilter;
    }

    /**
     * Internal method to reuse common loading logic
     * @param loader - Function that loads the Smart Filter from some source
     * @param source - Source of the Smart Filter (see SmartFilterSource)
     * @returns Promise that resolves with the loaded Smart Filter
     */
    private async _loadSmartFilterAsync(loader: () => Promise<SmartFilter>, source: SmartFilterSource): Promise<SmartFilter> {
        this._renderer.beforeRenderObservable.clear();

        // Load the Smart Filter using the provided function.
        const smartFilter = await loader();

        this.onSmartFilterLoadedObservable.notifyObservers({
            smartFilter,
            source,
        });

        return smartFilter;
    }
}
