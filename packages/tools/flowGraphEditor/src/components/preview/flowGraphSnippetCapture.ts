import { type Nullable } from "core/types";

// Matches the public flow graph snippet loaders, e.g.
// `ParseFlowGraphCoordinatorFromSnippetAsync` / `ParseFlowGraphFromSnippetAsync`.
const SnippetLoaderNameRegex = /FlowGraph[A-Za-z]*FromSnippetAsync$/;

/**
 * Handle returned by {@link CaptureFlowGraphSnippetId}. Read {@link snippetId}
 * after the playground has run, then call {@link restore} to undo the wrapping.
 */
export interface IFlowGraphSnippetCapture {
    /** The snippet id passed to the first live `...FromSnippetAsync` call, or null when none ran. */
    readonly snippetId: Nullable<string>;
    /** Restore the namespace's original loader functions. Idempotent. */
    restore(): void;
}

/**
 * Wrap every `...FromSnippetAsync` flow graph loader found on the given namespace
 * (typically the global `BABYLON`) so the snippet id of the first call made while
 * the wrappers are installed is recorded.
 *
 * This replaces source-text scanning: because the id is captured from a call that
 * actually executes, a commented-out loader (an inert preview scene) or a
 * `...FromSnippetAsync` substring that only appears inside a string/URL literal is
 * never executed and therefore never counted — no comment stripping required.
 *
 * The wrappers delegate to the originals, so the playground still builds its graph
 * exactly as before. Install before the snippet runs and {@link IFlowGraphSnippetCapture.restore | restore}
 * once it has finished.
 * @param namespace - the object whose loader functions should be wrapped (e.g. `globalThis.BABYLON`)
 * @returns a capture handle exposing the detected snippet id and a restore function
 */
export function CaptureFlowGraphSnippetId(namespace: Nullable<Record<string, any>> | undefined): IFlowGraphSnippetCapture {
    // Backing object so the wrapper closures can mutate the id the caller reads back.
    const state: { snippetId: Nullable<string>; restore: () => void } = {
        snippetId: null,
        restore: () => {},
    };

    if (!namespace) {
        return state;
    }

    const originals: { key: string; fn: (...args: any[]) => any }[] = [];
    for (const key of Object.keys(namespace)) {
        const value = namespace[key];
        if (typeof value === "function" && SnippetLoaderNameRegex.test(key)) {
            const original = value as (...args: any[]) => any;
            originals.push({ key, fn: original });
            namespace[key] = function (this: unknown, snippetId: unknown, ...rest: unknown[]) {
                // First live call wins, matching the previous first-match-wins behavior.
                if (state.snippetId === null && typeof snippetId === "string" && snippetId.trim().length > 0) {
                    state.snippetId = snippetId.trim();
                }
                return original.apply(this, [snippetId, ...rest]);
            };
        }
    }

    state.restore = () => {
        for (const { key, fn } of originals) {
            namespace[key] = fn;
        }
        originals.length = 0;
    };

    return state;
}
