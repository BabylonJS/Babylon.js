/**
 * @vitest-environment jsdom
 */
import { type PhysicsBody, type PhysicsMassProperties, type PhysicsWorld, type SceneContext } from "@babylonjs/lite";
import { act } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const State = vi.hoisted(() => {
    vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
    vi.stubGlobal(
        "matchMedia",
        vi.fn(() => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() }))
    );
    return {
        world: {} as PhysicsWorld,
        body: {} as PhysicsBody,
        readMass: vi.fn(),
        setMass: vi.fn(),
        readLinearVelocity: vi.fn(),
        setLinearVelocity: vi.fn(),
    };
});

vi.mock("@babylonjs/lite", async (importOriginal) => ({
    ...(await importOriginal<typeof import("@babylonjs/lite")>()),
    getPhysicsWorlds: (_scene: SceneContext) => [State.world],
    getPhysicsBodies: (_world: PhysicsWorld) => [State.body],
    getPhysicsBodyInstanceCount: () => 1,
    getPhysicsBodyMassPropertiesToRef: State.readMass,
    setPhysicsBodyMassProperties: State.setMass,
    getPhysicsBodyLinearVelocityToRef: State.readLinearVelocity,
    getPhysicsBodyAngularVelocityToRef: (_world: PhysicsWorld, _body: PhysicsBody, out: object) => Object.assign(out, { x: 4, y: 5, z: 6 }),
    setPhysicsBodyLinearVelocity: State.setLinearVelocity,
}));

import { PhysicsBodyMassProperties, PhysicsBodyVelocityProperties } from "../../src/lite/components/properties/physicsProperties";
import { CreateP9Engine, CreateP9Selection, CreateP9Watcher, RenderP9Properties } from "./liteP9TestUtils";

const Renders: ReturnType<typeof RenderP9Properties>[] = [];

function RenderMass() {
    const current: Required<PhysicsMassProperties> = {
        mass: 7,
        centerOfMass: { x: 1, y: 2, z: 3 },
        inertia: { x: 0, y: 4, z: 5 },
        inertiaOrientation: { x: 0, y: 0, z: 0, w: 1 },
    };
    State.readMass.mockImplementation((_world, _body, out) => Object.assign(out, structuredClone(current)));
    State.setMass.mockImplementation((_world, _body, next) => Object.assign(current, structuredClone(next)));
    const { watcher } = CreateP9Watcher();
    const render = RenderP9Properties(<PhysicsBodyMassProperties {...CreateP9Engine()} world={State.world} body={State.body} selectionService={CreateP9Selection()} />, watcher);
    Renders.push(render);
    return { current, watcher, container: render.container };
}

function Commit(input: HTMLInputElement, value: string) {
    act(() => input.focus());
    act(() => {
        Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(input, value);
        input.dispatchEvent(new Event("input", { bubbles: true }));
    });
    act(() => input.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true })));
}

beforeEach(() => vi.clearAllMocks());
afterEach(() => Renders.splice(0).forEach((render) => render.dispose()));

describe("Lite physics rejected writes with real numeric controls", () => {
    it.each([
        { label: "Mass", expandIndex: undefined, inputIndex: 0, previous: "7" },
        { label: "Center of Mass", expandIndex: 0, inputIndex: 1, previous: "1" },
        { label: "Inertia", expandIndex: 1, inputIndex: 2, previous: "4" },
    ])("restores $label after rejection and accepts the same value after unlocking", ({ expandIndex, inputIndex, previous }) => {
        const { current, watcher, container } = RenderMass();
        const input = () => container.querySelectorAll<HTMLInputElement>("input")[inputIndex];
        if (expandIndex !== undefined) {
            act(() => container.querySelectorAll<HTMLButtonElement>('[aria-label="Expand/Collapse property"]')[expandIndex].click());
        }
        expect(input().value).toBe(previous);
        Commit(input(), "99");
        expect(State.setMass).not.toHaveBeenCalled();
        expect(container.textContent).toContain("Cannot safely edit mass properties with zero inertia");
        expect(container.querySelectorAll('[aria-label="Expand/Collapse property"][aria-pressed="true"]')).toHaveLength(expandIndex === undefined ? 0 : 1);
        expect(input()).toBeDefined();
        expect(input().value).toBe(previous);
        // Repeat the rejected value, including the identical error and native readback.
        Commit(input(), "99");
        expect(container.querySelectorAll('[aria-label="Expand/Collapse property"][aria-pressed="true"]')).toHaveLength(expandIndex === undefined ? 0 : 1);
        expect(input()).toBeDefined();
        expect(input().value).toBe(previous);
        expect(State.setMass).not.toHaveBeenCalled();
        current.inertia.x = 3;
        act(() => watcher.refresh());
        Commit(input(), "99");
        expect(State.setMass).toHaveBeenCalledTimes(1);
        expect(input().value).toBe("99");
        expect(container.textContent).not.toContain("Cannot safely edit mass properties");
    });

    it("preserves expanded sibling rows, their input nodes, draft text and focus when Mass is rejected", () => {
        const { container } = RenderMass();
        const expanders = container.querySelectorAll<HTMLButtonElement>('[aria-label="Expand/Collapse property"]');
        act(() => expanders[0].click());
        act(() => expanders[1].click());
        const inputs = container.querySelectorAll<HTMLInputElement>("input");
        const mass = inputs[0];
        const centerX = inputs[1];
        const inertiaY = inputs[5];
        act(() => centerX.focus());
        act(() => {
            Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(centerX, "42");
            centerX.dispatchEvent(new Event("input", { bubbles: true }));
        });
        // Commit Mass directly without blurring (and committing) the sibling draft.
        act(() => {
            Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(mass, "99");
            mass.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
        });
        expect(State.setMass).not.toHaveBeenCalled();
        expect(container.querySelector<HTMLInputElement>("input")!.value).toBe("7");
        const after = container.querySelectorAll<HTMLInputElement>("input");
        expect(after).toHaveLength(7);
        expect(container.querySelectorAll('[aria-label="Expand/Collapse property"][aria-pressed="true"]')).toHaveLength(2);
        expect(after[1]).toBe(centerX);
        expect(after[5]).toBe(inertiaY);
        expect(centerX.value).toBe("42");
        expect(inertiaY.value).toBe("4");
        expect(document.activeElement).toBe(centerX);
        expect(container.textContent).toContain("Cannot safely edit mass properties");
    });

    it("keeps a rejected single-control velocity vector expanded and accepts an identical retry", () => {
        const velocity = { x: 1, y: 2, z: 3 };
        let reject = true;
        State.readLinearVelocity.mockImplementation((_world, _body, out) => Object.assign(out, velocity));
        State.setLinearVelocity.mockImplementation((_world, _body, next) => {
            if (reject) {
                throw new Error("Velocity write failed");
            }
            Object.assign(velocity, next);
        });
        const { watcher } = CreateP9Watcher();
        const render = RenderP9Properties(
            <PhysicsBodyVelocityProperties {...CreateP9Engine()} world={State.world} body={State.body} selectionService={CreateP9Selection()} />,
            watcher
        );
        Renders.push(render);
        const { container } = render;
        act(() => container.querySelector<HTMLButtonElement>('[aria-label="Expand/Collapse property"]')!.click());
        const input = () => container.querySelector<HTMLInputElement>("input")!;
        for (let attempt = 0; attempt < 2; attempt++) {
            Commit(input(), "99");
            expect(container.querySelectorAll('[aria-label="Expand/Collapse property"][aria-pressed="true"]')).toHaveLength(1);
            expect(container.querySelectorAll("input")).toHaveLength(3);
            expect(input().value).toBe("1");
            expect(container.textContent).toContain("Velocity write failed");
        }
        reject = false;
        Commit(input(), "99");
        expect(State.setLinearVelocity).toHaveBeenCalledTimes(3);
        expect(velocity).toEqual({ x: 99, y: 2, z: 3 });
        expect(input().value).toBe("99");
        expect(container.textContent).not.toContain("Velocity write failed");
    });
});
