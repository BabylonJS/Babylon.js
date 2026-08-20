import { ShaderLanguage } from "../Materials/shaderLanguage";

export type ShaderLoadFunction = () => Promise<unknown> | Promise<unknown>[];

/** Options for defining what shaders should be loaded. */
export interface IShaderLoaderOptions {
    /** Function used to define imports for WebGL. */
    webGL?: ShaderLoadFunction;
    /** Function used to define imports for WebGPU. */
    webGPU?: ShaderLoadFunction;
}

interface IShaderLoaderState {
    readonly supported: boolean;
    loaded: boolean;
    loadPromise: Promise<unknown> | null;
    readonly load: ShaderLoadFunction | undefined;
}

/** Utility class used to load shaders. */
export class ShaderLoader {
    private readonly webGL: IShaderLoaderState;
    private readonly webGPU: IShaderLoaderState;

    /**
     * @param options Options for defining what shaders should be loaded.
     */
    public constructor(options: IShaderLoaderOptions) {
        this.webGL = CreateState(options.webGL);
        this.webGPU = CreateState(options.webGPU);
    }

    /**
     * @param shaderLanguage The shader language to check for.
     * @returns `true` if the shader has already been loaded, `false` otherwise.
     */
    public isLoaded(shaderLanguage: ShaderLanguage): boolean {
        return this._getState(shaderLanguage).loaded;
    }

    /**
     * @param shaderLanguage The shader language to load for.
     * @returns A `Promise` if loading has started, `null` otherwise.
     */
    public load(shaderLanguage: ShaderLanguage): Promise<void> | null {
        const state = this._getState(shaderLanguage);
        return state.loaded ? null : LoadShaders(state);
    }

    /**
     * @param shaderLanguage The shader language to check for support in.
     * @returns `true` if supported, `false` otherwise.
     */
    public supported(shaderLanguage: ShaderLanguage): boolean {
        return this._getState(shaderLanguage).supported;
    }

    private _getState(shaderLanguage: ShaderLanguage): IShaderLoaderState {
        switch (shaderLanguage) {
            case ShaderLanguage.GLSL:
                return this.webGL;
            case ShaderLanguage.WGSL:
                return this.webGPU;
        }
    }
}

function CreateState(load: ShaderLoadFunction | undefined): IShaderLoaderState {
    const supported = load !== undefined;
    return {
        supported,
        loaded: !supported,
        loadPromise: null,
        load,
    };
}

async function LoadShaders(state: IShaderLoaderState): Promise<void> {
    let { loadPromise } = state;
    const first = loadPromise === null;
    if (first) {
        const { load } = state;
        if (load) {
            const loadPromise2 = load();
            loadPromise = Array.isArray(loadPromise2) ? Promise.all(loadPromise2) : loadPromise2;
            state.loadPromise = loadPromise;
        }
    }
    try {
        if (loadPromise !== null) {
            await loadPromise;
        }
        if (first) {
            // eslint-disable-next-line require-atomic-updates
            state.loaded = true;
        }
    } finally {
        if (first) {
            // eslint-disable-next-line require-atomic-updates
            state.loadPromise = null;
        }
    }
}
