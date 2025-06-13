import type { ThinEngine } from "@babylonjs/core/Engines/thinEngine";
import type { SmartFilter, SmartFilterDeserializer } from "@babylonjs/smart-filters";
import type { SmartFilterRenderer } from "./smartFilterRenderer";
import type { TextureRenderHelper } from "./textureRenderHelper";
import { Observable } from "@babylonjs/core/Misc/observable";
import type { Nullable } from "@babylonjs/core/types";

export type SerializedSmartFilterManifest = {
    type: "Serialized";
    name: string;
    getSmartFilterJson: () => Promise<any>;
};
export type HardCodedSmartFilterManifest = {
    type: "HardCoded";
    name: string;
    createSmartFilter: (engine: ThinEngine, renderer: SmartFilterRenderer) => Promise<SmartFilter>;
};

export type SmartFilterManifest = HardCodedSmartFilterManifest | SerializedSmartFilterManifest;

/**
 * Manges loading SmartFilters for the demo app
 */
export class SmartFilterLoader {
    private readonly _engine: ThinEngine;
    private readonly _renderer: SmartFilterRenderer;
    private readonly _textureRenderHelper: Nullable<TextureRenderHelper>;

    public readonly smartFilterDeserializer: SmartFilterDeserializer;
    public readonly onSmartFilterLoadedObservable: Observable<SmartFilter>;
    public readonly manifests: SmartFilterManifest[];

    public get defaultSmartFilterName(): string {
        const firstManifest = this.manifests[0];
        return firstManifest?.name || "";
    }

    constructor(
        engine: ThinEngine,
        renderer: SmartFilterRenderer,
        manifests: SmartFilterManifest[],
        smartFilterDeserializer: SmartFilterDeserializer,
        textureRenderHelper: Nullable<TextureRenderHelper>
    ) {
        this._engine = engine;
        this._renderer = renderer;
        this.manifests = manifests;
        this._textureRenderHelper = textureRenderHelper;
        this.onSmartFilterLoadedObservable = new Observable<SmartFilter>();
        if (this.manifests.length === 0) {
            throw new Error(
                "No SmartFilterManifests were passed to the SmartFilterLoader - add some manifests to smartFilterManifests.ts"
            );
        }
        this.smartFilterDeserializer = smartFilterDeserializer;
    }

    /**
     * Loads a SmartFilter from the manifest registered with the given name.
     * @param name - Name of manifest to load
     */
    public async loadFromManifest(name: string): Promise<SmartFilter> {
        this._renderer.beforeRenderObservable.clear();

        const manifest = this.manifests.find(
            (manifest) => manifest.name === name || manifest.name + " - optimized" === name
        );

        let smartFilter: SmartFilter;
        switch (manifest?.type) {
            case "HardCoded":
                {
                    smartFilter = await manifest.createSmartFilter(this._engine, this._renderer);
                }
                break;
            case "Serialized":
                {
                    const smartFilterJson = await manifest.getSmartFilterJson();
                    smartFilter = await this.smartFilterDeserializer.deserialize(this._engine, smartFilterJson);
                }
                break;
            default: {
                throw new Error("Could not read manifest " + name);
            }
        }

        // If the SmartFilter has a texture render helper, assign its input texture as the Smart Filter's output
        if (this._textureRenderHelper) {
            smartFilter.outputBlock.renderTargetWrapper = this._textureRenderHelper.renderTargetTexture.renderTarget;
        }

        this.onSmartFilterLoadedObservable.notifyObservers(smartFilter);

        return smartFilter;
    }
}
