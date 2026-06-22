/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeAll, afterAll } from "vitest";

import { Observable } from "core/Misc/observable";
import { Vector2, Vector3 } from "core/Maths/math.vector";
import { NullEngine } from "core/Engines/nullEngine";
import { Scene } from "core/scene";
import { FreeCamera } from "core/Cameras/freeCamera";
import { CreatePlane } from "core/Meshes/Builders/planeBuilder";

import { GetElementPixelFromUv, HtmlRaycastInteractionManager } from "core/Materials/Textures/HTML/htmlRaycastInteractionManager";
import { ComputeOverlayCssTransform, HtmlInteractionManager } from "core/Materials/Textures/HTML/htmlInteractionManager";

// jsdom historically does not implement PointerEvent; provide a minimal stand-in so the dispatch path runs.
let _installedPointerEventShim = false;
beforeAll(() => {
    if (typeof (globalThis as any).PointerEvent === "undefined") {
        _installedPointerEventShim = true;
        (globalThis as any).PointerEvent = class extends MouseEvent {
            public pointerId: number;
            public pointerType: string;
            public constructor(type: string, init: any = {}) {
                super(type, init);
                this.pointerId = init.pointerId ?? 0;
                this.pointerType = init.pointerType ?? "mouse";
            }
        };
    }
});

// Remove the shim we installed so it does not leak global state into other tests in this jsdom environment.
afterAll(() => {
    if (_installedPointerEventShim) {
        delete (globalThis as any).PointerEvent;
        _installedPointerEventShim = false;
    }
});

describe("GetElementPixelFromUv", () => {
    it("maps UV to element pixels with the V axis flipped by default", () => {
        expect(GetElementPixelFromUv(0.5, 0.5, 200, 100)).toEqual({ x: 100, y: 50 });
        expect(GetElementPixelFromUv(0, 1, 200, 100)).toEqual({ x: 0, y: 0 });
        expect(GetElementPixelFromUv(1, 0, 200, 100)).toEqual({ x: 200, y: 100 });
    });

    it("keeps the V axis when invertY is false", () => {
        expect(GetElementPixelFromUv(0.25, 0.25, 200, 100, false)).toEqual({ x: 50, y: 25 });
    });
});

describe("ComputeOverlayCssTransform", () => {
    it("serializes the overlay transform with origin-centered scaling", () => {
        expect(ComputeOverlayCssTransform(300, 200, 2, 3, 0, 100, 50)).toBe("translate(300px, 200px) rotate(0rad) scale(2, 3) translate(-50px, -25px)");
    });
});

describe("HtmlRaycastInteractionManager", () => {
    const createMock = () => {
        const scene = { onPointerObservable: new Observable<any>(), activeCamera: null } as any;
        const element = document.createElement("div");
        element.getBoundingClientRect = () => ({ left: 100, top: 50, width: 200, height: 100, right: 300, bottom: 150, x: 100, y: 50, toJSON() {} }) as DOMRect;
        const mesh = {} as any;
        return { scene, element, mesh };
    };

    const makePointerInfo = (type: number, pickedMesh: any, uv: Vector2 | null) =>
        ({
            type,
            event: { button: 0, buttons: 1, pointerId: 7, pointerType: "mouse" },
            pickInfo: {
                hit: true,
                pickedMesh,
                pickedPoint: new Vector3(0, 0, 0),
                getTextureCoordinates: () => uv,
                getNormal: () => null,
            },
        }) as any;

    it("forwards a pointer event to the mapped client position on a hit", () => {
        const { scene, element, mesh } = createMock();
        const manager = new HtmlRaycastInteractionManager(scene, { element } as any, mesh);

        let received: PointerEvent | null = null;
        element.addEventListener("pointerdown", (e) => (received = e as PointerEvent));

        scene.onPointerObservable.notifyObservers(makePointerInfo(0x01, mesh, new Vector2(0.5, 0.5)));

        expect(received).not.toBeNull();
        // UV (0.5, 0.5) -> element pixel (100, 50) -> client (100 + 100, 50 + 50).
        expect(received!.clientX).toBe(200);
        expect(received!.clientY).toBe(100);

        manager.dispose();
    });

    it("ignores hits on a different mesh", () => {
        const { scene, element, mesh } = createMock();
        const manager = new HtmlRaycastInteractionManager(scene, { element } as any, mesh);

        let called = false;
        element.addEventListener("pointermove", () => (called = true));

        scene.onPointerObservable.notifyObservers(makePointerInfo(0x04, {} as any, new Vector2(0.5, 0.5)));

        expect(called).toBe(false);
        manager.dispose();
    });

    it("stops forwarding after dispose", () => {
        const { scene, element, mesh } = createMock();
        const manager = new HtmlRaycastInteractionManager(scene, { element } as any, mesh);

        let called = false;
        element.addEventListener("pointerdown", () => (called = true));

        manager.dispose();
        scene.onPointerObservable.notifyObservers(makePointerInfo(0x01, mesh, new Vector2(0.5, 0.5)));

        expect(called).toBe(false);
    });

    it("routes events to the deepest child under the mapped point and synthesizes a click on pointerup", () => {
        const { scene, element, mesh } = createMock();
        const button = document.createElement("button");
        // (0.5, 0.5) maps to client (200, 100); this child's box contains that point.
        button.getBoundingClientRect = () => ({ left: 150, top: 80, width: 100, height: 40, right: 250, bottom: 120, x: 150, y: 80, toJSON() {} }) as DOMRect;
        element.appendChild(button);

        const manager = new HtmlRaycastInteractionManager(scene, { element } as any, mesh);

        let clicks = 0;
        button.addEventListener("click", () => clicks++);

        // A down/up pair resolving to the same child produces exactly one click on that child.
        scene.onPointerObservable.notifyObservers(makePointerInfo(0x01, mesh, new Vector2(0.5, 0.5)));
        scene.onPointerObservable.notifyObservers(makePointerInfo(0x02, mesh, new Vector2(0.5, 0.5)));

        expect(clicks).toBe(1);
        manager.dispose();
    });

    it("does not synthesize a click when the release lands on a different target", () => {
        const { scene, element, mesh } = createMock();
        const button = document.createElement("button");
        button.getBoundingClientRect = () => ({ left: 150, top: 80, width: 100, height: 40, right: 250, bottom: 120, x: 150, y: 80, toJSON() {} }) as DOMRect;
        element.appendChild(button);

        const manager = new HtmlRaycastInteractionManager(scene, { element } as any, mesh);

        let clicks = 0;
        button.addEventListener("click", () => clicks++);

        // Press on the button, release where only the root element is hit (UV (0, 1) -> client (100, 50)).
        scene.onPointerObservable.notifyObservers(makePointerInfo(0x01, mesh, new Vector2(0.5, 0.5)));
        scene.onPointerObservable.notifyObservers(makePointerInfo(0x02, mesh, new Vector2(0, 1)));

        expect(clicks).toBe(0);
        manager.dispose();
    });

    it("does not synthesize a click for non-primary mouse buttons", () => {
        const { scene, element, mesh } = createMock();
        const button = document.createElement("button");
        button.getBoundingClientRect = () => ({ left: 150, top: 80, width: 100, height: 40, right: 250, bottom: 120, x: 150, y: 80, toJSON() {} }) as DOMRect;
        element.appendChild(button);

        const manager = new HtmlRaycastInteractionManager(scene, { element } as any, mesh);

        let clicks = 0;
        button.addEventListener("click", () => clicks++);

        // A right-button (button 2) down/up pair on the same target must not synthesize a click.
        const rightButtonInfo = (type: number) =>
            ({
                type,
                event: { button: 2, buttons: 2, pointerId: 7, pointerType: "mouse" },
                pickInfo: {
                    hit: true,
                    pickedMesh: mesh,
                    pickedPoint: new Vector3(0, 0, 0),
                    getTextureCoordinates: () => new Vector2(0.5, 0.5),
                    getNormal: () => null,
                },
            }) as any;

        scene.onPointerObservable.notifyObservers(rightButtonInfo(0x01));
        scene.onPointerObservable.notifyObservers(rightButtonInfo(0x02));

        expect(clicks).toBe(0);
        manager.dispose();
    });

    it("contains synthetic events so they do not bubble back to the host's ancestors", () => {
        const { scene, element, mesh } = createMock();
        const parent = document.createElement("div");
        parent.appendChild(element);

        const manager = new HtmlRaycastInteractionManager(scene, { element } as any, mesh);

        let bubbled = 0;
        parent.addEventListener("pointerdown", () => bubbled++);

        scene.onPointerObservable.notifyObservers(makePointerInfo(0x01, mesh, new Vector2(0.5, 0.5)));

        // The engine's rendering canvas is an ancestor of the host element; synthetic events must not reach it.
        expect(bubbled).toBe(0);
        manager.dispose();
    });

    it("caches layout rects so repeated pointer events do not re-read the DOM", () => {
        const { scene, mesh } = createMock();
        const element = document.createElement("div");
        const button = document.createElement("button");
        element.appendChild(button);

        let elementReads = 0;
        let buttonReads = 0;
        element.getBoundingClientRect = () => {
            elementReads++;
            return { left: 100, top: 50, width: 200, height: 100, right: 300, bottom: 150, x: 100, y: 50, toJSON() {} } as DOMRect;
        };
        button.getBoundingClientRect = () => {
            buttonReads++;
            return { left: 150, top: 80, width: 100, height: 40, right: 250, bottom: 120, x: 150, y: 80, toJSON() {} } as DOMRect;
        };

        const manager = new HtmlRaycastInteractionManager(scene, { element } as any, mesh);

        // Three identical moves should only trigger a single burst of layout reads thanks to the rect cache.
        for (let i = 0; i < 3; i++) {
            scene.onPointerObservable.notifyObservers(makePointerInfo(0x04, mesh, new Vector2(0.5, 0.5)));
        }

        expect(elementReads).toBe(1);
        expect(buttonReads).toBe(1);
        manager.dispose();
    });
});

describe("HtmlInteractionManager", () => {
    it("prepares the element for overlay and cleans up on dispose", () => {
        const scene = { onAfterRenderObservable: new Observable<any>(), activeCamera: null } as any;
        const element = document.createElement("div");

        const manager = new HtmlInteractionManager(scene, { element } as any, {} as any, { enablePointerEvents: true });

        expect(element.style.position).toBe("absolute");
        expect(element.style.transformOrigin).toBe("0 0");
        expect(element.style.pointerEvents).toBe("auto");
        expect(scene.onAfterRenderObservable.hasObservers()).toBe(true);

        manager.dispose();
        expect(scene.onAfterRenderObservable.hasObservers()).toBe(false);
    });

    it("clears a host-applied inert attribute so native interaction works, and restores it on dispose", () => {
        const scene = { onAfterRenderObservable: new Observable<any>(), activeCamera: null } as any;
        const element = document.createElement("div");
        // HtmlTexture marks the element inert while hosting it inside the rendering canvas.
        element.setAttribute("inert", "");

        const manager = new HtmlInteractionManager(scene, { element } as any, {} as any, { enablePointerEvents: true });
        expect(element.hasAttribute("inert")).toBe(false);

        manager.dispose();
        expect(element.hasAttribute("inert")).toBe(true);
    });

    it("projects the mesh and writes a transform during rendering", () => {
        const engine = new NullEngine({ renderHeight: 256, renderWidth: 256, textureSize: 256, deterministicLockstep: false, lockstepMaxSteps: 1 });
        const scene = new Scene(engine);
        const camera = new FreeCamera("camera", new Vector3(0, 0, -5), scene);
        camera.setTarget(Vector3.Zero());
        scene.activeCamera = camera;
        const plane = CreatePlane("plane", { size: 2 }, scene);
        const element = document.createElement("div");

        const manager = new HtmlInteractionManager(scene, { element } as any, plane);
        scene.render();

        expect(element.style.transform).toContain("translate");

        manager.dispose();
        scene.dispose();
        engine.dispose();
    });
});
