import { IsWindowObjectExist } from "../../Misc/domManagement";
import { Tools } from "../../Misc/tools";

declare function importScripts(...urls: string[]): void;

/**
 * Options to load the associated Twgsl library
 */
export interface TwgslOptions {
    /**
     * Defines an existing instance of Twgsl (useful in modules who do not access the global instance).
     */
    twgsl?: any;
    /**
     * Defines the URL of the twgsl JS File.
     */
    jsPath?: string;
    /**
     * Defines the URL of the twgsl WASM File.
     */
    wasmPath?: string;
}

/** @internal */
export class WebGPUTintWASM {
    // Default twgsl options.
    private static readonly _TWgslDefaultOptions: TwgslOptions = {
        jsPath: "https://preview.babylonjs.com/twgsl/twgsl.js",
        wasmPath: "https://preview.babylonjs.com/twgsl/twgsl.wasm",
    };

    public static ShowWGSLShaderCode = false;

    private _twgsl: any = null;

    public async initTwgsl(twgslOptions?: TwgslOptions): Promise<void> {
        twgslOptions = twgslOptions || {};
        twgslOptions = {
            ...WebGPUTintWASM._TWgslDefaultOptions,
            ...twgslOptions,
        };

        if (twgslOptions.twgsl) {
            this._twgsl = twgslOptions.twgsl;
            return Promise.resolve();
        }

        if (twgslOptions.jsPath && twgslOptions.wasmPath) {
            if (IsWindowObjectExist()) {
                await Tools.LoadScriptAsync(twgslOptions.jsPath);
            } else {
                importScripts(twgslOptions.jsPath);
            }
        }

        if ((self as any).twgsl) {
            this._twgsl = await (self as any).twgsl(twgslOptions!.wasmPath);
            return Promise.resolve();
        }

        return Promise.reject("twgsl is not available.");
    }

    public convertSpirV2WGSL(code: Uint32Array): string {
        const ccode = this._twgsl.convertSpirV2WGSL(code);
        if (WebGPUTintWASM.ShowWGSLShaderCode) {
            console.log(ccode);
            console.log("***********************************************");
        }
        return ccode;
    }
}
