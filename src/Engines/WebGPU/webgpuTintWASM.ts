import { DomManagement } from "../../Misc/domManagement";
import { Tools } from "../../Misc/tools";
import { Nullable } from "../../types";

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

/** @hidden */
export class WebGPUTintWASM {
    // Default twgsl options.
    private static readonly _twgslDefaultOptions: TwgslOptions = {
        jsPath: "https://preview.babylonjs.com/twgsl/twgsl.js",
        wasmPath: "https://preview.babylonjs.com/twgsl/twgsl.wasm",
    };

    private static _TwgslInitedResolve: Nullable<() => void> = null;
    private static _TwgslInited = false;

    private _twgsl: any = null;

    /** @hidden */
    public static _TWGSLModuleInitialized(): void {
        if (WebGPUTintWASM._TwgslInitedResolve) {
            WebGPUTintWASM._TwgslInitedResolve();
        }
        WebGPUTintWASM._TwgslInited = true;
    }

    public initTwgsl(twgslOptions?: TwgslOptions): Promise<void> {
        twgslOptions = twgslOptions || {};
        twgslOptions = {
            ...WebGPUTintWASM._twgslDefaultOptions,
            ...twgslOptions
        };

        if (twgslOptions.twgsl) {
            this._twgsl = twgslOptions.twgsl;
            return Promise.resolve();
        }

        if ((self as any).twgsl) {
            this._twgsl = (self as any).twgsl;
            return Promise.resolve();
        }

        (self as any).Module = undefined;
        if (twgslOptions.jsPath && twgslOptions.wasmPath) {
            if (DomManagement.IsWindowObjectExist()) {
                return Tools.LoadScriptAsync(twgslOptions.jsPath)
                    .then(() => {
                        return new Promise((resolve) => {
                            const twgsl = (self as any).Module;
                            (self as any).twgsl = twgsl;
                            this._twgsl = twgsl;
                            if (!WebGPUTintWASM._TwgslInited) {
                                WebGPUTintWASM._TwgslInitedResolve = resolve;
                            } else {
                                resolve(twgsl);
                            }
                        });
                    });
            } else {
                importScripts(twgslOptions.jsPath);
                (self as any).twgsl = (self as any).Module;
                this._twgsl = (self as any).twgsl;
            }
        }

        return Promise.reject("twgsl is not available.");
    }

    public convertSpirV2WGSL(code: Uint32Array): string {
        let wgsl: string = "";

        this._twgsl._return_string_callback = (data: number, length: number) => {
            const bytes = new Uint8ClampedArray(this._twgsl.HEAPU8.subarray(data, data + length));
            wgsl = String.fromCharCode(...Array.from(bytes));
        };

        let addr = this._twgsl._malloc(code.byteLength);
        this._twgsl.HEAPU32.set(code, addr / 4);
        this._twgsl._spirv_to_wgsl(addr, code.byteLength);
        this._twgsl._free(addr);

        return wgsl;
    }

}