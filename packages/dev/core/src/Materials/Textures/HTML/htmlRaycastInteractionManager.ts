import { type Scene } from "../../../scene.pure";
import { type AbstractMesh } from "../../../Meshes/abstractMesh.pure";
import { type HtmlTexture } from "./htmlTexture";
import { type Observer } from "../../../Misc/observable.pure";
import { type PointerInfo, PointerEventTypes } from "../../../Events/pointerEvents";
import { type Nullable } from "../../../types";

// Attribution: the raycast/UV event-routing technique used here is prior art from
// `three-html-render` (Palash Bansal, MIT) and Jake Archibald's `curved-markup` demo.
// The implementation below is a clean-room rewrite against Babylon.js' own picking APIs.

/**
 * Maps a UV coordinate sampled from an {@link HtmlTexture} to a pixel position inside the source element.
 *
 * When `invertY` is true (the default, matching {@link HtmlTexture}'s default upload orientation) the V
 * axis is flipped so that `v = 1` maps to the top of the element, matching the top-left origin used by
 * DOM layout.
 * @param u horizontal texture coordinate, normally in [0, 1]
 * @param v vertical texture coordinate, normally in [0, 1]
 * @param width element width in pixels
 * @param height element height in pixels
 * @param invertY whether the texture content is stored Y-inverted (default true)
 * @returns the pixel position `{ x, y }` within the element
 */
export function GetElementPixelFromUv(u: number, v: number, width: number, height: number, invertY: boolean = true): { x: number; y: number } {
    return { x: u * width, y: (invertY ? 1 - v : v) * height };
}

/**
 * Options for {@link HtmlRaycastInteractionManager}.
 */
export interface IHtmlRaycastInteractionManagerOptions {
    /** The DOM element that receives the forwarded pointer events (defaults to the texture's element). */
    targetElement?: HTMLElement;
    /** Whether hits on back-facing geometry are ignored (default true). */
    backFaceCulling?: boolean;
    /** Whether the texture content is stored Y-inverted, used when mapping UVs to element pixels (default true). */
    invertY?: boolean;
}

/**
 * Routes Babylon pointer events to a live HTML element rendered through an {@link HtmlTexture}.
 *
 * On every pointer event the scene is picked; when the configured mesh is hit, the picked UV is mapped to
 * a pixel inside the source element and an equivalent DOM pointer (and mouse) event is dispatched there.
 * This works for arbitrary meshes (planes, boxes, curved surfaces) because it relies on UV coordinates
 * rather than a flat CSS overlay. For a perspective-correct overlay on planar surfaces, see
 * {@link HtmlInteractionManager}.
 */
export class HtmlRaycastInteractionManager {
    private readonly _scene: Scene;
    private readonly _mesh: AbstractMesh;
    private readonly _element: HTMLElement;
    private readonly _backFaceCulling: boolean;
    private readonly _invertY: boolean;
    private _observer: Nullable<Observer<PointerInfo>>;
    private _downTarget: Nullable<EventTarget>;
    private readonly _containHandler: (evt: Event) => void;
    private readonly _rectCache = new Map<HTMLElement, DOMRect>();
    private _rectCacheValid = false;
    private readonly _invalidateRectCache: () => void;
    private _resizeObserver: Nullable<ResizeObserver> = null;
    private _mutationObserver: Nullable<MutationObserver> = null;

    /**
     * Creates a raycast interaction manager.
     * @param scene the scene to listen to for pointer events
     * @param texture the HTML texture whose element should receive the forwarded events
     * @param mesh the mesh displaying the texture; only hits on this mesh are forwarded
     * @param options optional configuration
     */
    constructor(scene: Scene, texture: HtmlTexture, mesh: AbstractMesh, options: IHtmlRaycastInteractionManagerOptions = {}) {
        this._scene = scene;
        this._mesh = mesh;
        this._element = options.targetElement ?? texture.element;
        this._backFaceCulling = options.backFaceCulling ?? true;
        this._invertY = options.invertY ?? true;

        // The hosted element is a child of the engine's rendering canvas, where Babylon's own input
        // listeners live. The synthetic events we dispatch bubble, so without this they would reach the
        // canvas and be re-interpreted as real input - moving the camera and re-entering this manager in a
        // feedback loop. Stopping propagation at the host element keeps them inside the HTML subtree (so
        // event delegation still works) while never leaking back to the engine.
        this._containHandler = (evt: Event) => evt.stopPropagation();
        for (const type of _ContainedEventTypes) {
            this._element.addEventListener(type, this._containHandler);
        }

        // Resolving the target reads layout (getBoundingClientRect) for the element and its descendants on
        // every pointer event. Cache those rects and only re-read them when layout can actually change - on
        // size changes, DOM mutations, or viewport scroll/resize - so high-frequency pointermove events stay
        // pure arithmetic instead of forcing a synchronous reflow each time.
        this._invalidateRectCache = () => {
            this._rectCacheValid = false;
        };
        if (typeof ResizeObserver !== "undefined") {
            this._resizeObserver = new ResizeObserver(this._invalidateRectCache);
            this._resizeObserver.observe(this._element);
        }
        if (typeof MutationObserver !== "undefined") {
            this._mutationObserver = new MutationObserver(this._invalidateRectCache);
            this._mutationObserver.observe(this._element, { attributes: true, childList: true, characterData: true, subtree: true });
        }
        if (typeof window !== "undefined") {
            window.addEventListener("resize", this._invalidateRectCache);
            window.addEventListener("scroll", this._invalidateRectCache, true);
        }

        this._observer = scene.onPointerObservable.add((pointerInfo) => this._onPointer(pointerInfo));
    }

    private _onPointer(pointerInfo: PointerInfo): void {
        const domName = _PointerTypeToDomEvent(pointerInfo.type);
        if (!domName) {
            return;
        }

        const pickInfo = pointerInfo.pickInfo;
        if (!pickInfo || !pickInfo.hit || pickInfo.pickedMesh !== this._mesh) {
            return;
        }

        if (this._backFaceCulling && this._isBackFace(pointerInfo)) {
            return;
        }

        const uv = pickInfo.getTextureCoordinates();
        if (!uv) {
            return;
        }

        const rect = this._getRect(this._element);
        const { x, y } = GetElementPixelFromUv(uv.x, uv.y, rect.width || this._element.offsetWidth, rect.height || this._element.offsetHeight, this._invertY);

        this._dispatch(domName, rect.left + x, rect.top + y, pointerInfo);
    }

    private _isBackFace(pointerInfo: PointerInfo): boolean {
        const pickInfo = pointerInfo.pickInfo!;
        const normal = pickInfo.getNormal(true, true);
        if (!normal || !pickInfo.pickedPoint) {
            return false;
        }
        const camera = this._scene.activeCamera;
        if (!camera) {
            return false;
        }
        // The face is back-facing when its world normal points away from the camera-to-surface direction.
        const toSurface = pickInfo.pickedPoint.subtract(camera.globalPosition);
        return normal.dot(toSurface) > 0;
    }

    private _dispatch(domName: string, clientX: number, clientY: number, pointerInfo: PointerInfo): void {
        if (typeof PointerEvent === "undefined") {
            return;
        }

        const sourceEvent = pointerInfo.event as Partial<PointerEvent>;
        // document.elementFromPoint is unreliable here: the element is hosted inside the engine's rendering
        // canvas (whose painted WebGL/WebGPU content covers the DOM children) and is marked `inert`, so the
        // browser's own hit testing skips it. Resolve the deepest descendant under the mapped point manually
        // from the laid-out subtree instead; synthetic dispatch still triggers listeners on inert elements.
        const target = this._resolveTarget(clientX, clientY);

        const init: PointerEventInit = {
            bubbles: true,
            cancelable: true,
            clientX,
            clientY,
            button: sourceEvent.button ?? 0,
            buttons: sourceEvent.buttons ?? 0,
            pointerId: sourceEvent.pointerId ?? 1,
            pointerType: sourceEvent.pointerType ?? "mouse",
        };

        target.dispatchEvent(new PointerEvent(domName, init));

        const mouseName = _PointerToMouseEvent(domName);
        if (mouseName) {
            target.dispatchEvent(new MouseEvent(mouseName, init));
        }

        // The browser synthesizes a "click" from a native down/up pair, but synthetic mouse events do not,
        // so we emit it ourselves: on pointerdown remember the target, then on pointerup dispatch a click
        // when the release lands on the same element (matching native click semantics closely enough).
        if (domName === "pointerdown") {
            this._downTarget = target;
        } else if (domName === "pointerup") {
            if (this._downTarget === target) {
                target.dispatchEvent(new MouseEvent("click", init));
            }
            this._downTarget = null;
        }
    }

    /**
     * Resolves the deepest descendant of the hosted element whose layout box contains the given client point.
     * @param clientX horizontal client coordinate
     * @param clientY vertical client coordinate
     * @returns the deepest matching element, or the hosted element itself when no descendant matches
     */
    private _resolveTarget(clientX: number, clientY: number): HTMLElement {
        let target: HTMLElement = this._element;
        let advanced = true;
        while (advanced) {
            advanced = false;
            const children = target.children;
            for (let i = children.length - 1; i >= 0; i--) {
                const child = children[i] as HTMLElement;
                const rect = this._getRect(child);
                if (clientX >= rect.left && clientX <= rect.right && clientY >= rect.top && clientY <= rect.bottom) {
                    target = child;
                    advanced = true;
                    break;
                }
            }
        }
        return target;
    }

    /**
     * Returns the client rect of an element, served from a cache that is rebuilt only when layout may have
     * changed (see the constructor). This keeps pointer routing free of per-event layout reads.
     * @param element the element whose bounding rect is needed
     * @returns the element's cached {@link DOMRect}
     */
    private _getRect(element: HTMLElement): DOMRect {
        if (!this._rectCacheValid) {
            this._rectCache.clear();
            this._rectCacheValid = true;
        }
        let rect = this._rectCache.get(element);
        if (!rect) {
            rect = element.getBoundingClientRect();
            this._rectCache.set(element, rect);
        }
        return rect;
    }

    /**
     * Detaches the manager and stops forwarding pointer events.
     */
    public dispose(): void {
        for (const type of _ContainedEventTypes) {
            this._element.removeEventListener(type, this._containHandler);
        }
        if (this._resizeObserver) {
            this._resizeObserver.disconnect();
            this._resizeObserver = null;
        }
        if (this._mutationObserver) {
            this._mutationObserver.disconnect();
            this._mutationObserver = null;
        }
        if (typeof window !== "undefined") {
            window.removeEventListener("resize", this._invalidateRectCache);
            window.removeEventListener("scroll", this._invalidateRectCache, true);
        }
        this._rectCache.clear();
        if (this._observer) {
            this._scene.onPointerObservable.remove(this._observer);
            this._observer = null;
        }
    }
}

function _PointerTypeToDomEvent(type: number): Nullable<string> {
    switch (type) {
        case PointerEventTypes.POINTERDOWN:
            return "pointerdown";
        case PointerEventTypes.POINTERUP:
            return "pointerup";
        case PointerEventTypes.POINTERMOVE:
            return "pointermove";
        default:
            return null;
    }
}

function _PointerToMouseEvent(domName: string): Nullable<string> {
    switch (domName) {
        case "pointerdown":
            return "mousedown";
        case "pointerup":
            return "mouseup";
        case "pointermove":
            return "mousemove";
        default:
            return null;
    }
}

// Synthetic event types we dispatch into the hosted element; they are contained at the host so they do
// not bubble back into the engine's rendering canvas (see the constructor for the rationale).
const _ContainedEventTypes = ["pointerdown", "pointerup", "pointermove", "mousedown", "mouseup", "mousemove", "click"] as const;
