/**
 * The kind of USD resource limit that was exceeded. Doubles as a stable programmatic code.
 */
export type UsdResourceLimitKind = "value-nesting" | "prim-nesting" | "composition-nodes" | "composition-depth" | "composition-work";

/**
 * Error thrown when parsing or composing an untrusted USD asset exceeds a configured resource limit.
 *
 * Carries structured fields ({@link kind}, {@link limit}, {@link actual}, {@link path}) so callers can
 * branch on the failure programmatically without parsing the message string. It is intentionally
 * distinct from malformed-syntax errors (which remain plain `Error`) so the two can be told apart.
 */
export class UsdResourceLimitError extends Error {
    /** Which resource limit was exceeded. */
    public readonly kind: UsdResourceLimitKind;
    /** The configured limit that was exceeded. */
    public readonly limit: number;
    /** The value that exceeded the limit, when known. */
    public readonly actual?: number;
    /** The USD path associated with the failure, when known. */
    public readonly path?: string;

    /**
     * Creates a UsdResourceLimitError.
     * @param kind which resource limit was exceeded
     * @param limit the configured limit that was exceeded
     * @param message a human-readable description of the failure
     * @param details optional actual value and USD path associated with the failure
     */
    public constructor(kind: UsdResourceLimitKind, limit: number, message: string, details?: { actual?: number; path?: string }) {
        super(message);
        this.name = "UsdResourceLimitError";
        this.kind = kind;
        this.limit = limit;
        this.actual = details?.actual;
        this.path = details?.path;
        // Restore the prototype chain so `instanceof` works when this class is transpiled/bundled.
        Object.setPrototypeOf(this, UsdResourceLimitError.prototype);
    }
}

/**
 * Error thrown when a USD loading option is configured with an invalid value, such as a fractional,
 * negative, `NaN`, infinite, or otherwise unsafe resource limit.
 *
 * It is distinct from {@link UsdResourceLimitError} so an invalid configuration can be told apart from
 * an asset that legitimately hit a limit.
 */
export class UsdConfigurationError extends Error {
    /** The name of the option that was invalid, when known. */
    public readonly option?: string;

    /**
     * Creates a UsdConfigurationError.
     * @param message a human-readable description of the invalid configuration
     * @param option optional name of the invalid option
     */
    public constructor(message: string, option?: string) {
        super(message);
        this.name = "UsdConfigurationError";
        this.option = option;
        // Restore the prototype chain so `instanceof` works when this class is transpiled/bundled.
        Object.setPrototypeOf(this, UsdConfigurationError.prototype);
    }
}

/**
 * Validates that a configured resource limit is a finite, non-negative safe integer (zero is allowed).
 *
 * Rejects `undefined`-free callers should guard first; this throws a {@link UsdConfigurationError} for
 * any non-number, `NaN`, `Infinity`, fractional, negative, or unsafe-integer value.
 * @param value the configured value to validate
 * @param option the option name, used in the error message and on the thrown error
 * @returns the validated value
 */
export function ValidateResourceLimit(value: number, option: string): number {
    if (typeof value !== "number" || !Number.isFinite(value)) {
        throw new UsdConfigurationError(`USD loading option '${option}' must be a finite number, received ${String(value)}.`, option);
    }
    if (!Number.isSafeInteger(value)) {
        throw new UsdConfigurationError(`USD loading option '${option}' must be a safe integer, received ${value}.`, option);
    }
    if (value < 0) {
        throw new UsdConfigurationError(`USD loading option '${option}' must be non-negative, received ${value}.`, option);
    }
    return value;
}
