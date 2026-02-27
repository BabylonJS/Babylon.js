import type { IFormatter } from "./xml.interfaces";

/**
 *
 */
export interface IXmlSerializerNumberOptions {
    /**
     *
     */
    eps: number;
    /**
     *
     */
    maxDecimalsCap?: number; // default 15
    /**
     *
     */
    trimTrailingZeros?: boolean; // default true
    /**
     *
     */
    fixedDecimals?: number; // optional, overrides trim
    /**
     *
     */
    allowScientific?: boolean; // default false
    /**
     *
     */
    snapNearZero?: boolean; // default true
    /**
     *
     */
    zeroThreshold?: number; // default eps
    /**
     *
     */
    perAttributeEps?: Record<string, number>;
}

/**
 *
 */
export interface IXmlSerializerFormatOptions {
    /**
     *
     */
    number?: IXmlSerializerNumberOptions;
}

export const DefaultXmlSerializerNumberOptions: Readonly<IXmlSerializerNumberOptions> = Object.freeze({
    eps: 1e-6,
    maxDecimalsCap: 15,
    trimTrailingZeros: true,
    // fixedDecimals: undefined,
    allowScientific: false,
    snapNearZero: true,
    // zeroThreshold defaults to eps if not provided
    // perAttributeEps: undefined,
});

export const DefaultXmlSerializerFormatOptions: Readonly<IXmlSerializerFormatOptions> = Object.freeze({
    number: DefaultXmlSerializerNumberOptions,
});

/**
 *@param opts
 *@returns
 */
export function ResolveNumberOptions(opts?: IXmlSerializerNumberOptions): Required<
    Omit<IXmlSerializerNumberOptions, "perAttributeEps" | "fixedDecimals" | "maxDecimalsCap" | "trimTrailingZeros" | "allowScientific" | "snapNearZero" | "zeroThreshold">
> &
    Pick<IXmlSerializerNumberOptions, "perAttributeEps" | "fixedDecimals"> & {
        maxDecimalsCap: number;
        trimTrailingZeros: boolean;
        allowScientific: boolean;
        snapNearZero: boolean;
        zeroThreshold: number;
    } {
    const eps = opts?.eps ?? DefaultXmlSerializerNumberOptions.eps;

    return {
        eps,
        maxDecimalsCap: opts?.maxDecimalsCap ?? DefaultXmlSerializerNumberOptions.maxDecimalsCap!,
        trimTrailingZeros: opts?.trimTrailingZeros ?? DefaultXmlSerializerNumberOptions.trimTrailingZeros!,
        fixedDecimals: opts?.fixedDecimals,
        allowScientific: opts?.allowScientific ?? DefaultXmlSerializerNumberOptions.allowScientific!,
        snapNearZero: opts?.snapNearZero ?? DefaultXmlSerializerNumberOptions.snapNearZero!,
        zeroThreshold: opts?.zeroThreshold ?? eps,
        perAttributeEps: opts?.perAttributeEps,
    };
}

/**
 *@param opts
 *@returns
 */
export function ResolveFormatOptions(opts?: IXmlSerializerFormatOptions) {
    return {
        number: ResolveNumberOptions(opts?.number),
    };
}

/**
 *
 */
export class NumberFormatter implements IFormatter<number> {
    private _o: IXmlSerializerNumberOptions;

    /**
     *
     * @param o
     */
    public constructor(public o: IXmlSerializerFormatOptions) {
        this._o = o.number!;

        if (!Number.isFinite(this._o.eps) || this._o.eps <= 0) {
            throw new Error("opts.eps must be a finite, positive number");
        }
    }

    /**
     *
     * @param x
     * @returns
     */

    public toString(x: number): string {
        if (!Number.isFinite(x)) {
            throw new Error(`Cannot format non-finite number: ${x}`);
        }

        const opts = this._o;
        const maxDecimalsCap = this._clampInt(opts.maxDecimalsCap ?? 15, 0, 20);
        const trimTrailingZeros = opts.trimTrailingZeros ?? true;
        const snapNearZero = opts.snapNearZero ?? true;
        const zeroThreshold = opts.zeroThreshold ?? opts.eps;

        // Quantize to eps grid
        const inv = 1 / opts.eps;
        let q = Math.round(x * inv) / inv;

        // Normalize -0 to 0
        if (Object.is(q, -0)) {
            q = 0;
        }

        // Snap tiny values to 0 (helps size + stability)
        if (snapNearZero && Math.abs(q) <= zeroThreshold) {
            q = 0;
        }

        // Choose decimals policy
        let decimals: number;
        if (opts.fixedDecimals !== undefined) {
            decimals = this._clampInt(opts.fixedDecimals, 0, maxDecimalsCap);
        } else {
            // decimals needed for eps steps
            decimals = this._clampInt(Math.ceil(-Math.log10(opts.eps)), 0, maxDecimalsCap);
        }

        // Note: this implementation intentionally avoids scientific notation.
        // If allowScientific=true, you may want a different path (toPrecision).
        if (opts.allowScientific) {
            // Still avoid scientific here; keep deterministic fixed output.
            // If you really want scientific, implement a separate branch.
        }

        // Fast path when decimals = 0
        if (decimals === 0) {
            return String(Math.trunc(q));
        }

        // Start fixed, then optionally trim
        let s = q.toFixed(decimals);

        if (trimTrailingZeros && opts.fixedDecimals === undefined) {
            // Trim trailing zeros and optional trailing dot
            s = s
                .replace(/(\.\d*?[1-9])0+$/, "$1")
                .replace(/\.0+$/, "")
                .replace(/\.$/, "");
        }

        // Safety: ensure no scientific notation (should not happen with toFixed)
        if (/[eE]/.test(s)) {
            throw new Error(`Scientific notation not allowed in XML output: ${s}`);
        }

        return s;
    }

    private _clampInt(n: number, min: number, max: number): number {
        if (!Number.isFinite(n)) {
            return min;
        }
        n = Math.trunc(n);
        return Math.max(min, Math.min(max, n));
    }
}
