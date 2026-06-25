/**
 * A named input candidate used by the shared validation helpers.
 */
export interface IInputCandidate<T = unknown> {
    /** Friendly label shown in validation error messages. */
    label: string;
    /** The raw value supplied by the caller. */
    value: T | null | undefined;
}

/**
 * Shared options for presence and alias validation.
 */
export interface IInputValidationOptions<T = unknown> {
    /** Inputs to validate in the order they should be considered. */
    candidates: IInputCandidate<T>[];
    /** Optional custom error message to use instead of the generated one. */
    missingMessage?: string;
    /** Optional custom predicate that determines whether a candidate is present. */
    isPresent?: (value: T | null | undefined) => boolean;
}

/**
 * Determine whether an input should be considered present.
 * @param value - The candidate value to inspect.
 * @returns True when the input is defined and, for strings, non-empty.
 */
export function IsInputProvided(value: unknown): boolean {
    if (value === undefined || value === null) {
        return false;
    }

    if (typeof value === "string") {
        return value.length > 0;
    }

    return true;
}

/**
 * Require that at least one input candidate is present.
 * @param options - Candidates and optional custom validation settings.
 */
export function RequireAtLeastOneInput<T>(options: IInputValidationOptions<T>): void {
    const isPresent = options.isPresent ?? IsInputProvided;

    if (!options.candidates.some((candidate) => isPresent(candidate.value))) {
        throw new Error(options.missingMessage ?? `Error: ${FormatEitherOrMessage(options.candidates.map((candidate) => candidate.label))} must be provided.`);
    }
}

/**
 * Resolve the first present input candidate and throw when none are provided.
 * @param options - Candidates and optional custom validation settings.
 * @returns The first present candidate value.
 */
export function ResolveDefinedInput<T>(options: IInputValidationOptions<T>): T {
    const isPresent = options.isPresent ?? IsInputProvided;

    RequireAtLeastOneInput(options);

    for (const candidate of options.candidates) {
        if (isPresent(candidate.value)) {
            return candidate.value as T;
        }
    }

    throw new Error(options.missingMessage ?? `Error: ${FormatEitherOrMessage(options.candidates.map((candidate) => candidate.label))} must be provided.`);
}

function FormatEitherOrMessage(labels: string[]): string {
    if (labels.length === 1) {
        return labels[0];
    }

    if (labels.length === 2) {
        return `Either ${labels[0]} or ${labels[1]}`;
    }

    return `Either ${labels.slice(0, -1).join(", ")}, or ${labels[labels.length - 1]}`;
}
