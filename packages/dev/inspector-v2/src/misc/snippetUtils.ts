/**
 * Shared utilities for snippet server operations (save/load).
 */

/**
 * Persist a snippet ID to local storage for quick reuse.
 * @param storageKey The local storage key to use.
 * @param snippetId The snippet ID to persist.
 * @param maxItems Maximum number of items to store (default 50).
 */
export function PersistSnippetId(storageKey: string, snippetId: string, maxItems: number = 50): void {
    try {
        const existing = JSON.parse(localStorage.getItem(storageKey) || "[]");
        const list = Array.isArray(existing) ? existing : [];
        if (!list.includes(snippetId)) {
            list.unshift(snippetId);
        }
        localStorage.setItem(storageKey, JSON.stringify(list.slice(0, maxItems)));
    } catch {
        // Ignore storage failures.
    }
}

/**
 * Configuration for saving to the snippet server.
 */
export type SaveToSnippetConfig = {
    /** The base URL of the snippet server. */
    snippetUrl: string;
    /** The current snippet ID (if updating an existing snippet). */
    currentSnippetId?: string;
    /** The serialized content to save. */
    content: string;
    /** The key name for the payload (e.g., "particleSystem", "spriteManager"). */
    payloadKey: string;
    /** Optional local storage key for persisting snippet IDs. */
    storageKey?: string;
    /** Optional friendly name for the entity type (used in alerts). */
    entityName?: string;
};

/**
 * Result from saving to the snippet server.
 */
export type SaveToSnippetResult = {
    /** The new snippet ID. */
    snippetId: string;
    /** The previous snippet ID (or "_BLANK" if none). */
    oldSnippetId: string;
};

/**
 * Save content to the snippet server.
 * @param config Configuration for the save operation.
 * @returns Promise resolving to the save result.
 */
export async function SaveToSnippetServer(config: SaveToSnippetConfig): Promise<SaveToSnippetResult> {
    const { snippetUrl, currentSnippetId, content, payloadKey, storageKey, entityName } = config;

    const dataToSend = {
        payload: JSON.stringify({
            [payloadKey]: content,
        }),
        name: "",
        description: "",
        tags: "",
    };

    const headers = new Headers();
    headers.append("Content-Type", "application/json");

    let response: Response;
    try {
        response = await fetch(snippetUrl + (currentSnippetId ? "/" + currentSnippetId : ""), {
            method: "POST",
            headers,
            body: JSON.stringify(dataToSend),
        });
    } catch (e) {
        const errorMsg = `Unable to save your ${entityName ?? "content"}: ${e}`;
        alert(errorMsg);
        throw new Error(errorMsg);
    }

    if (!response.ok) {
        const errorMsg = `Unable to save your ${entityName ?? "content"}`;
        alert(errorMsg);
        throw new Error(errorMsg);
    }

    const snippet = await response.json();
    const oldSnippetId = currentSnippetId || "_BLANK";
    let newSnippetId = snippet.id;
    if (snippet.version && snippet.version !== "0") {
        newSnippetId += "#" + snippet.version;
    }

    // Copy to clipboard when available.
    if (navigator.clipboard) {
        await navigator.clipboard.writeText(newSnippetId);
    }

    // Persist to local storage if configured.
    if (storageKey) {
        PersistSnippetId(storageKey, newSnippetId);
    }

    // Show success alert
    alert(`${entityName ?? "Content"} saved with ID: ${newSnippetId} (the id was also saved to your clipboard)`);

    return {
        snippetId: newSnippetId,
        oldSnippetId,
    };
}

/**
 * Configuration for loading from the snippet server.
 */
export type LoadFromSnippetConfig = {
    /** The base URL of the snippet server. */
    snippetUrl: string;
    /** The snippet ID to load. */
    snippetId: string;
    /** Optional friendly name for the entity type (used in alerts). */
    entityName?: string;
};

/**
 * Load content from the snippet server.
 * @param config Configuration for the load operation.
 * @returns Promise resolving to the parsed response object.
 */
export async function LoadFromSnippetServer(config: LoadFromSnippetConfig): Promise<any> {
    const { snippetUrl, snippetId, entityName } = config;

    let response: Response;
    try {
        response = await fetch(snippetUrl + "/" + snippetId.replace(/#/g, "/"));
    } catch (e) {
        const errorMsg = `Unable to load your ${entityName ?? "content"}: ${e}`;
        alert(errorMsg);
        throw new Error(errorMsg);
    }

    if (!response.ok) {
        const errorMsg = `Unable to load your ${entityName ?? "content"}`;
        alert(errorMsg);
        throw new Error(errorMsg);
    }

    return await response.json();
}

/**
 * Prompt the user for a snippet ID.
 * @param message The prompt message.
 * @returns The trimmed snippet ID, or null if cancelled/empty.
 */
export function PromptForSnippetId(message: string = "Please enter the snippet ID to use"): string | null {
    const requestedSnippetId = window.prompt(message);
    const trimmed = requestedSnippetId?.trim();
    return trimmed || null;
}

/**
 * Notify the playground about a snippet ID change (for code replacement).
 * NOTE this is an anti-pattern, instead playground should hook in and observe changes / update its own code
 * This is a legacy approach and should not be copied elsewhere
 * @param oldSnippetId The previous snippet ID.
 * @param newSnippetId The new snippet ID.
 * @param parseMethodName The name of the parse method (e.g., "SpriteManager.ParseFromSnippetAsync").
 */
export function NotifyPlaygroundOfSnippetChange(oldSnippetId: string, newSnippetId: string, parseMethodName: string): void {
    const windowAsAny = window as any;
    if (windowAsAny.Playground && oldSnippetId) {
        windowAsAny.Playground.onRequestCodeChangeObservable.notifyObservers({
            regex: new RegExp(`${parseMethodName}\\("${oldSnippetId}`, "g"),
            replace: `${parseMethodName}("${newSnippetId}`,
        });
    }
}
