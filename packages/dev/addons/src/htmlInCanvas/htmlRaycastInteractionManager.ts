// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { type Scene } from "core/scene";
import { type AbstractMesh } from "core/Meshes/abstractMesh";
import { type HtmlTexture } from "core/Materials/Textures/htmlTexture";
import { type Observer } from "core/Misc/observable";
import { type PointerInfo, PointerEventTypes } from "core/Events/pointerEvents";
import { type Nullable } from "core/types";

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

        const rect = this._element.getBoundingClientRect();
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
        // Prefer the deepest element under the mapped point when supported; otherwise dispatch to the root element.
        const picked = typeof document !== "undefined" && typeof document.elementFromPoint === "function" ? document.elementFromPoint(clientX, clientY) : null;
        const target = picked ?? this._element;

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
    }

    /**
     * Detaches the manager and stops forwarding pointer events.
     */
    public dispose(): void {
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
