import { Logger } from "core/Misc/logger";
import { Tools } from "../../Misc/tools";

/**
 * Options to load the associated Twgsl library
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
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
    private static readonly _TwgslDefaultOptions: TwgslOptions = {
        jsPath: `${Tools._DefaultCdnUrl}/twgsl/twgsl.js`,
        wasmPath: `${Tools._DefaultCdnUrl}/twgsl/twgsl.wasm`,
    };

    public static ShowWGSLShaderCode = false;

    public static DisableUniformityAnalysis = false;

    private static _Twgsl: any = null;

    // eslint-disable-next-line @typescript-eslint/naming-convention
    public async initTwgsl(twgslOptions?: TwgslOptions): Promise<void> {
        if (WebGPUTintWASM._Twgsl) {
            return;
        }

        twgslOptions = twgslOptions || {};
        twgslOptions = {
            ...WebGPUTintWASM._TwgslDefaultOptions,
            ...twgslOptions,
        };

        if (twgslOptions.twgsl) {
            WebGPUTintWASM._Twgsl = twgslOptions.twgsl;
            return;
        }

        if (twgslOptions.jsPath && twgslOptions.wasmPath) {
            await Tools.LoadBabylonScriptAsync(twgslOptions.jsPath);
        }

        if ((self as any).twgsl) {
            // eslint-disable-next-line require-atomic-updates
            WebGPUTintWASM._Twgsl = await (self as any).twgsl(Tools.GetBabylonScriptURL(twgslOptions.wasmPath!));
            return;
        }

        throw new Error("twgsl is not available.");
    }

    public convertSpirV2WGSL(code: Uint32Array, disableUniformityAnalysis = false): string {
        const ccode = WebGPUTintWASM._Twgsl.convertSpirV2WGSL(code, WebGPUTintWASM.DisableUniformityAnalysis || disableUniformityAnalysis);
        if (WebGPUTintWASM.ShowWGSLShaderCode) {
            Logger.Log(ccode);
            Logger.Log("***********************************************");
        }
        return WebGPUTintWASM.DisableUniformityAnalysis || disableUniformityAnalysis ? "diagnostic(off, derivative_uniformity);\n" + ccode : ccode;
    }
}
