/**
 * @vitest-environment jsdom
 */

import { Color3 } from "core/Maths/math.color";
import { Vector3 } from "core/Maths/math.vector";
import { FluentProvider, webLightTheme } from "@fluentui/react-components";
import { act, createRef, type ComponentProps, type ForwardRefExoticComponent, type FunctionComponent, type ReactNode, type RefAttributes } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.hoisted(() => {
    vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
    vi.stubGlobal(
        "matchMedia",
        vi.fn(() => ({
            matches: false,
            addEventListener: vi.fn(),
            removeEventListener: vi.fn(),
        }))
    );
});

import { Color3PropertyLine as FullColor3PropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/colorPropertyLine";
import { Vector3PropertyLine as FullVector3PropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/vectorPropertyLine";
import { Color3PropertyLine as LiteColor3PropertyLine } from "shared-ui-components/lite/fluent/hoc/propertyLines/colorPropertyLine";
import {
    CreateQuaternionFromEuler,
    QuaternionPropertyLine as LiteQuaternionPropertyLine,
    Vector3PropertyLine as LiteVector3PropertyLine,
} from "shared-ui-components/lite/fluent/hoc/propertyLines/vectorPropertyLine";
import { DerivedProperty } from "../../src/components/properties/boundProperty";
import { DirectionalLightSetupProperties, SetLightProperty } from "../../src/lite/components/properties/lightProperties";

vi.stubGlobal("NodeFilter", window.NodeFilter);

describe("runtime-neutral property-line wrappers", () => {
    const containers: HTMLElement[] = [];
    const roots: Root[] = [];

    afterEach(() => {
        roots.splice(0).forEach((root) => act(() => root.unmount()));
        containers.splice(0).forEach((container) => container.remove());
    });

    function Render(content: ReactNode): HTMLElement {
        const container = document.createElement("div");
        document.body.appendChild(container);
        containers.push(container);
        const root = createRoot(container);
        roots.push(root);
        act(() => root.render(<FluentProvider theme={webLightTheme}>{content}</FluentProvider>));
        return container;
    }

    it("preserves Full Babylon class-facing values", () => {
        const vector = new Vector3(1, 2, 3);
        const color = new Color3(0.25, 0.5, 0.75);
        const container = Render(
            <>
                <FullVector3PropertyLine label="Vector" value={vector} onChange={vi.fn()} />
                <FullColor3PropertyLine label="Color" value={color} onChange={vi.fn()} />
            </>
        );

        expect(container.textContent).toContain("[1.00, 2.00, 3.00]");
        expect(container.querySelectorAll("button").length).toBeGreaterThan(0);
    });

    it("preserves Full color refs and forwards disabled state to Full and Lite pickers", () => {
        const ref = createRef<HTMLDivElement>();
        const RefColorPropertyLine = FullColor3PropertyLine as ForwardRefExoticComponent<ComponentProps<typeof FullColor3PropertyLine> & RefAttributes<HTMLDivElement>>;
        const container = Render(
            <>
                <RefColorPropertyLine ref={ref} label="Full Color" value={new Color3(1, 0, 0)} onChange={vi.fn()} disabled />
                <LiteColor3PropertyLine label="Lite Color" value={[0, 1, 0]} onChange={vi.fn()} disabled />
            </>
        );

        expect(ref.current).toBeInstanceOf(HTMLDivElement);
        expect(container.querySelectorAll("button[disabled]")).toHaveLength(2);
    });

    it("accepts Lite tuple and structural values without constructing Full classes", () => {
        const container = Render(
            <>
                <LiteVector3PropertyLine label="Tuple" value={[1, 2, 3]} onChange={vi.fn()} />
                <LiteVector3PropertyLine label="Object" value={{ x: 4, y: 5, z: 6 }} onChange={vi.fn()} />
                <LiteQuaternionPropertyLine label="Rotation" value={[0, 0, 0, 1]} onChange={vi.fn()} useEuler useDegrees />
                <LiteColor3PropertyLine label="Color" value={[1, 0.5, 0]} onChange={vi.fn()} />
            </>
        );

        expect(container.textContent).toContain("[1.00, 2.00, 3.00]");
        expect(container.textContent).toContain("[4.00, 5.00, 6.00]");
        expect(container.textContent).toContain("[0, 0, 0]");
        expect(container.querySelectorAll("button").length).toBeGreaterThan(0);
    });

    it("renders watched Lite light vectors without a render loop", () => {
        const light = {
            direction: { x: -0.5, y: -1, z: 0.25 },
            position: { x: 4, y: 6, z: -3 },
            diffuse: [1, 1, 1],
            specular: [1, 1, 1],
            intensity: 0.5,
        } as Parameters<typeof DirectionalLightSetupProperties>[0]["light"];
        const container = Render(<DirectionalLightSetupProperties light={light} />);

        expect(container.textContent).toContain("[4.00, 6.00, -3.00]");
        expect(container.textContent).toContain("[-0.50, -1.00, 0.25]");
    });

    it("invalidates Lite light rendering after plain color and intensity writes", () => {
        const directionSet = vi.fn();
        const light = {
            direction: { x: -0.5, y: -1, z: 0.25, set: directionSet },
            position: { x: 4, y: 6, z: -3, set: vi.fn() },
            diffuse: [1, 1, 1] as [number, number, number],
            specular: [1, 1, 1] as [number, number, number],
            intensity: 0.5,
        };

        SetLightProperty(light, "diffuse", [0.2, 0.4, 0.6]);
        expect(light.diffuse).toEqual([0.2, 0.4, 0.6]);
        expect(directionSet).toHaveBeenLastCalledWith(-0.5, -1, 0.25);

        SetLightProperty(light, "intensity", 0.25);
        expect(light.intensity).toBe(0.25);
        expect(directionSet).toHaveBeenCalledTimes(2);
    });

    it("supports reusable watched projections with custom write-back", () => {
        const target = { storedValue: 2 };
        const NumberProperty: FunctionComponent<{ label: string; value: number; onChange: (value: number) => void }> = (props) => {
            const { label, value, onChange } = props;
            return <button onClick={() => onChange(value + 2)}>{`${label}: ${value}`}</button>;
        };
        const container = Render(
            <DerivedProperty
                component={NumberProperty}
                label="Derived"
                target={target}
                getValue={(value) => value.storedValue * 2}
                setValue={(value, changedValue) => (value.storedValue = changedValue / 2)}
            />
        );

        expect(container.textContent).toBe("Derived: 4");
        act(() => container.querySelector("button")?.click());
        expect(target.storedValue).toBe(3);
    });

    it("preserves Lite quaternion representation during Euler conversion", () => {
        expect(CreateQuaternionFromEuler([0, 0, 0], [0, 0, 0, 1])).toEqual([0, 0, 0, 1]);
        expect(CreateQuaternionFromEuler({ x: 0, y: 0, z: 0 }, { x: 0, y: 0, z: 0, w: 1 })).toEqual({ x: 0, y: 0, z: 0, w: 1 });
    });
});
