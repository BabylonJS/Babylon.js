import { DomManagement } from "../../Misc/domManagement";
import { Tools } from "../../Misc/tools";

declare function importScripts(...urls: string[]): void;

/**
 * Module to use to transpile glsl to wgsl
 */
 export enum TranspilerModule {
    /** Does not transpile */
    None,
    /** Use Tint WASM */
    TintWASM,
    /** Use Naga WASM */
    NagaWASM,
}

/**
 * Options to load the associated Twgsl or Nagasm library
 */
 export interface TranspilerOptions {
    /**
     * Defines an existing instance of Twgsl (useful in modules who do not access the global instance).
     */
    twgsl?: any;
    /**
     * Defines an existing instance of Nagasm (useful in modules who do not access the global instance).
     */
    nagasm?: any;
    /**
     * Defines the URL of the twgsl JS File.
     */
    jsPath?: string;
    /**
     * Defines the URL of the twgsl WASM File.
     */
    wasmPath?: string;
    /**
     * Defines the URL of the Nagasm JS File.
     */
    jsPathNagasm?: string;
    /**
      * Defines the URL of the Nagasm WASM File.
      */
    wasmPathNagasm?: string;
 }

/** @hidden */
export class WebGPUTranspiler {
    // Default transpiler options.
    private static readonly _transpilerDefaultOptions: TranspilerOptions = {
        jsPath: "https://preview.babylonjs.com/twgsl/twgsl.js",
        wasmPath: "https://preview.babylonjs.com/twgsl/twgsl.wasm",
        jsPathNagasm: "https://preview.babylonjs.com/nagasm/nagasm.js",
        wasmPathNagasm: "https://preview.babylonjs.com/nagasm/nagasm.wasm",
    };

    private _useNagasm = false;

    private _module: any = null;

    public get mustConvertInputToSpirV() {
        return !this._useNagasm;
    }

    constructor(transpilerModule: TranspilerModule) {
        this._useNagasm = transpilerModule === TranspilerModule.NagaWASM;
    }

    public async init(transpilerOptions?: TranspilerOptions): Promise<void> {
        transpilerOptions = transpilerOptions || {};
        transpilerOptions = {
            ...WebGPUTranspiler._transpilerDefaultOptions,
            ...transpilerOptions
        };

        const moduleName = this._useNagasm ? "nagasm" : "twgsl";
        if (transpilerOptions[moduleName]) {
            this._module = transpilerOptions[moduleName];
            return Promise.resolve();
        }

        const jsPath = this._useNagasm ? "jsPathNagasm" : "jsPath";
        const wasmPath = this._useNagasm ? "wasmPathNagasm" : "wasmPath";
        if (transpilerOptions[jsPath] && transpilerOptions[wasmPath]) {
            if (DomManagement.IsWindowObjectExist()) {
                await Tools.LoadScriptAsync(transpilerOptions[jsPath]!);
            } else {
                importScripts(transpilerOptions[jsPath]!);
            }
        }

        if ((self as any)[moduleName]) {
            this._module = await (self as any)[moduleName](transpilerOptions[wasmPath]);
            return Promise.resolve();
        }

        return Promise.reject(`${this._useNagasm ? "Nagasm" : "Twgsl"} is not available.`);
    }

    public transpile(code: Uint32Array | string, stage: string): string {
        if (this._useNagasm) {
            code = (code as string).replace(/,column_major/gm, "");
            code = (code as string).replace(/const +/gm, "");
            code = (code as string).replace(/layout\(std140\) uniform;/gm, "");
            code = (code as string).replace(/main\(void\)/gm, "main()");
        }
        const wgsl = this._useNagasm ? this._module.transpile(code, stage) : this._module.convertSpirV2WGSL(code);
        if (this._useNagasm && (wgsl.length < 100 || wgsl.indexOf("fn ") < 0)) {
            console.error("***************************************************");
            console.error("*******             " + stage + "                *******");
            console.error("****************      GLSL       ******************");
            console.error(code);
            console.error("****************      WGSL       ******************");
            console.error(wgsl);
        }
        return wgsl;
    }

}