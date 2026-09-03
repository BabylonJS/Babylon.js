import { ShaderLanguage } from "../Materials/shaderLanguage";

type ShaderImportFunction = () => readonly Promise<unknown>[];

interface IShaderImportState {
    readonly load: ShaderImportFunction;
    loaded: boolean;
    loadPromise: Promise<unknown> | null;
}

/**
 * Caches dynamic shader imports per shader language.
 * @internal
 */
export class _ShaderImportLoader {
    private readonly _webGL: IShaderImportState;
    private readonly _webGPU: IShaderImportState;

    /**
     * Creates a shader import loader.
     * @param loadWebGL Imports the GLSL shader modules.
     * @param loadWebGPU Imports the WGSL shader modules.
     */
    public constructor(loadWebGL: ShaderImportFunction, loadWebGPU: ShaderImportFunction) {
        this._webGL = { load: loadWebGL, loaded: false, loadPromise: null };
        this._webGPU = { load: loadWebGPU, loaded: false, loadPromise: null };
    }

    /**
     * Gets the initialization callback needed to load shaders for the requested language.
     * @param shaderLanguage The shader language to load.
     * @returns The shared loading callback, or `undefined` when the shaders are already loaded.
     */
    public getLoadCallback(shaderLanguage: ShaderLanguage): (() => Promise<void>) | undefined {
        const state = shaderLanguage === ShaderLanguage.WGSL ? this._webGPU : this._webGL;
        return state.loaded
            ? undefined
            : async () => {
                  await this._loadAsync(state);
              };
    }

    private async _loadAsync(state: IShaderImportState): Promise<void> {
        if (state.loaded) {
            return;
        }

        let loadPromise = state.loadPromise;
        const ownsLoad = loadPromise === null;

        if (ownsLoad) {
            loadPromise = Promise.all(state.load());
            state.loadPromise = loadPromise;
        }

        let loaded = false;
        try {
            await loadPromise;
            loaded = true;
        } finally {
            if (ownsLoad) {
                this._completeLoad(state, loaded);
            }
        }
    }

    private _completeLoad(state: IShaderImportState, loaded: boolean): void {
        state.loaded = loaded;
        state.loadPromise = null;
    }
}
