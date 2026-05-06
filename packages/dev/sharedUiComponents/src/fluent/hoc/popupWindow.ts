import { Logger } from "core/Misc/logger";

/**
 * Options for opening a popup browser window via {@link OpenPopupWindow}.
 */
export type PopupWindowOptions = {
    /**
     * Title set on the popup document.
     */
    title?: string;

    /**
     * Default width of the popup in pixels.
     * @remarks Ignored if `id` is provided and a previously saved width exists.
     */
    defaultWidth?: number;

    /**
     * Default height of the popup in pixels.
     * @remarks Ignored if `id` is provided and a previously saved height exists.
     */
    defaultHeight?: number;

    /**
     * Default screen-X position of the popup in pixels.
     * @remarks Ignored if `id` is provided and a previously saved position exists.
     */
    defaultLeft?: number;

    /**
     * Default screen-Y position of the popup in pixels.
     * @remarks Ignored if `id` is provided and a previously saved position exists.
     */
    defaultTop?: number;

    /**
     * Optional unique identity. When provided, the popup's bounds are saved to and
     * restored from `localStorage` under the key `Babylon/Settings/PopupWindow/{id}/Bounds`.
     */
    id?: string;

    /**
     * Optional callback invoked when the popup is closed (by the user or via {@link PopupWindowHandle.dispose}).
     */
    onClose?: () => void;
};

/**
 * Handle returned from {@link OpenPopupWindow}.
 */
export type PopupWindowHandle = {
    /**
     * The popup `Window` object. May become `closed` if the user dismisses the popup.
     */
    readonly popupWindow: Window;

    /**
     * A flex container element appended to the popup body. Render the tool into this element.
     */
    readonly hostElement: HTMLDivElement;

    /**
     * Closes the popup window and removes any listeners installed on the parent.
     * Safe to call multiple times.
     */
    dispose: () => void;
};

const StorageKeyPrefix = "Babylon/Settings/PopupWindow";

type SavedBounds = { left: number; top: number; width: number; height: number };

function LoadSavedBounds(id: string): Partial<SavedBounds> | null {
    const stored = localStorage.getItem(`${StorageKeyPrefix}/${id}/Bounds`);
    if (!stored) {
        return null;
    }
    try {
        const parsed = JSON.parse(stored) as Partial<SavedBounds>;
        return parsed;
    } catch {
        Logger.Warn(`Could not parse saved bounds for popup window with id ${id}`);
        return null;
    }
}

function SaveBounds(id: string, bounds: SavedBounds) {
    try {
        localStorage.setItem(`${StorageKeyPrefix}/${id}/Bounds`, JSON.stringify(bounds));
    } catch {
        // Storage may be full / disabled — bounds simply won't persist.
    }
}

function ResolveBounds(options: PopupWindowOptions): SavedBounds {
    const saved = options.id ? LoadSavedBounds(options.id) : null;

    const width = options.defaultWidth ?? saved?.width ?? Math.floor(window.innerWidth * (2 / 3));
    const height = options.defaultHeight ?? saved?.height ?? Math.floor(window.innerHeight * (2 / 3));
    const left = options.defaultLeft ?? saved?.left ?? Math.floor(window.screenX + (window.innerWidth - width) / 2);
    const top = options.defaultTop ?? saved?.top ?? Math.floor(window.screenY + (window.innerHeight - height) / 2);

    // When the caller passes explicit width/height/left/top, always honour them; otherwise fall
    // back to the (saved or computed) values above. The order above already gives explicit
    // options precedence, so just build the resulting bounds now.
    return { left, top, width, height };
}

function ToFeaturesString(bounds: SavedBounds): string {
    return `width=${bounds.width},height=${bounds.height},left=${bounds.left},top=${bounds.top},location=no`;
}

/**
 * Opens a new browser popup window suitable for hosting a Fluent-based modular tool.
 *
 * The popup body is configured for full-bleed flex layout and a host `<div>` is appended
 * for the tool to render into. Fluent style targeting (Griffel `RendererProvider`,
 * `FluentProvider` with `targetDocument`) is the caller's responsibility — typically wired
 * up by `MakeModularTool`, which derives `targetDocument` from `containerElement.ownerDocument`.
 *
 * **Must be called synchronously in response to a user interaction** (e.g. button click) —
 * otherwise the browser will block the popup as a scripted popup.
 *
 * @param options Window options. See {@link PopupWindowOptions}.
 * @returns A handle to the popup window and its host element, plus a `dispose` to close it.
 *          `null` if the popup was blocked by the browser.
 */
export function OpenPopupWindow(options: PopupWindowOptions = {}): PopupWindowHandle | null {
    const bounds = ResolveBounds(options);

    const popupWindow = window.open("", "", ToFeaturesString(bounds));
    if (!popupWindow) {
        return null;
    }

    if (options.title) {
        popupWindow.document.title = options.title;
    }

    const popupBody = popupWindow.document.body;
    popupBody.style.width = "100%";
    popupBody.style.height = "100%";
    popupBody.style.margin = "0";
    popupBody.style.padding = "0";
    popupBody.style.display = "flex";
    popupBody.style.overflow = "hidden";

    const hostElement = popupWindow.document.createElement("div");
    hostElement.style.width = "100%";
    hostElement.style.height = "100%";
    hostElement.style.margin = "0";
    hostElement.style.padding = "0";
    popupBody.appendChild(hostElement);

    // Track the most recently observed window bounds. In some browsers (e.g. Firefox), accessing
    // properties like screenX on a closed window throws, so we cache the last known good values
    // to use as a fallback when saving after the window has already been closed.
    const getBounds = (): SavedBounds => ({
        left: popupWindow.screenX,
        top: popupWindow.screenY,
        width: popupWindow.innerWidth,
        height: popupWindow.innerHeight,
    });
    let lastBounds = bounds;

    const onPopupBeforeUnload = () => {
        try {
            lastBounds = getBounds();
        } catch {
            // Use the cached lastBounds.
        }
    };
    popupWindow.addEventListener("beforeunload", onPopupBeforeUnload);

    let disposed = false;
    const teardown = () => {
        if (disposed) {
            return;
        }
        disposed = true;

        if (options.id) {
            try {
                if (!popupWindow.closed) {
                    lastBounds = getBounds();
                }
            } catch {
                // Use the cached lastBounds.
            }
            SaveBounds(options.id, lastBounds);
        }

        popupWindow.removeEventListener("beforeunload", onPopupBeforeUnload);
        window.removeEventListener("unload", onParentUnload);

        if (!popupWindow.closed) {
            popupWindow.close();
        }

        options.onClose?.();
    };

    const onPopupUnload = () => {
        teardown();
    };
    popupWindow.addEventListener("unload", onPopupUnload, { once: true });

    // If the parent window is unloaded (page refresh / navigation), don't leave the popup orphaned.
    const onParentUnload = () => {
        if (!popupWindow.closed) {
            popupWindow.close();
        }
    };
    window.addEventListener("unload", onParentUnload, { once: true });

    return {
        popupWindow,
        hostElement,
        dispose: teardown,
    };
}
