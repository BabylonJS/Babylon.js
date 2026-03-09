import type { Nullable } from "core/types";

import { Observable } from "core/Misc/observable";
import { Logger } from "core/Misc/logger";

/**
 * Manages log output from the retargeting process as a DOM overlay over the viewport canvas.
 * Intercepts BABYLON.Logger.OnNewCacheEntry and writes to the overlay element.
 */
export class HTMLConsole {
    private _element: HTMLDivElement;
    private _isVisible = false;
    private _originalHandler: Nullable<(entry: string) => void>;

    /** Fires with the new visibility state whenever the console is shown or hidden. */
    public readonly onVisibilityChangedObservable = new Observable<boolean>();

    public get isVisible(): boolean {
        return this._isVisible;
    }

    public constructor() {
        this._element = document.createElement("div");
        this._element.style.cssText = [
            "position:absolute",
            "bottom:10px",
            "left:10px",
            "right:10px",
            "height:200px",
            "background:rgba(18,18,18,0.88)",
            "color:#ccc",
            "font-size:11px",
            "font-family:monospace",
            "padding:6px 8px",
            "overflow-y:scroll",
            "word-break:break-all",
            "pointer-events:auto",
            "z-index:10",
            "border-radius:4px",
            "display:none",
        ].join(";");

        this._originalHandler = Logger.OnNewCacheEntry;
        Logger.OnNewCacheEntry = (entry: string) => {
            // Strip function-name prefix (e.g. "RetargetAnimationGroup...: ") and trailing <br>.
            const cleaned = entry
                .replace(/RetargetAnimationGroup.*?: /g, "")
                .replace(/<br\s*\/?>/gi, "")
                .trimEnd();
            this._element.insertAdjacentHTML("beforeend", cleaned);
            this._element.scrollTop = this._element.scrollHeight;
            // Auto-show the console the first time output arrives (matches original PG behavior)
            if (!this._isVisible) {
                this._isVisible = true;
                this._element.style.display = "block";
                this.onVisibilityChangedObservable.notifyObservers(true);
            }
            this._originalHandler?.(entry);
        };
    }

    /** Appends the overlay element to the given container (should be position:relative). */
    public attachToContainer(container: HTMLElement): void {
        container.appendChild(this._element);
    }

    public toggle(): void {
        this._isVisible = !this._isVisible;
        this._element.style.display = this._isVisible ? "block" : "none";
        this.onVisibilityChangedObservable.notifyObservers(this._isVisible);
    }

    public clear(): void {
        while (this._element.firstChild) {
            this._element.removeChild(this._element.firstChild);
        }
    }

    public dispose(): void {
        Logger.OnNewCacheEntry = this._originalHandler as (entry: string) => void;
        this._originalHandler = null;
        this._element.remove();
    }
}
