/**
 * @vitest-environment jsdom
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { FluentProvider, webLightTheme } from "@fluentui/react-components";
import { Color3 } from "core/Maths/math.color";
import { act, type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";

import { MaterialPropertySection } from "shared-ui-components/fluent/hoc/propertyLines/materialPropertyLine";
import {
    CreateBooleanMaterialPropertyModel as CreateBabylonBooleanModel,
    CreateColor3MaterialPropertyModel as CreateBabylonColorModel,
    CreateNumberMaterialPropertyModel as CreateBabylonNumberModel,
} from "shared-ui-components/fluent/hoc/propertyLines/materialPropertyAdapters";
import {
    CreateBooleanMaterialPropertyModel as CreateLiteBooleanModel,
    CreateColor3MaterialPropertyModel as CreateLiteColorModel,
    CreateNumberMaterialPropertyModel as CreateLiteNumberModel,
} from "shared-ui-components/lite/fluent/hoc/propertyLines/materialPropertyAdapters";
import { MaterialTextureBindingPropertyLine, type MaterialTextureBindingModel } from "shared-ui-components/fluent/hoc/propertyLines/materialTextureBindingPropertyLine";
import { TextureMetadataProperties } from "shared-ui-components/fluent/hoc/propertyLines/textureMetadataProperties";

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

vi.stubGlobal("NodeFilter", window.NodeFilter);

describe("material and texture parity cores", () => {
    const roots: Root[] = [];
    const containers: HTMLElement[] = [];

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

    it("renders controlled scalar, vector, color, matrix, option, and readonly material fields", () => {
        const onBooleanChange = vi.fn();
        const container = Render(
            <MaterialPropertySection
                model={{
                    fields: [
                        { kind: "boolean", id: "enabled", label: "Enabled", value: true, onChange: onBooleanChange },
                        { kind: "number", id: "roughness", label: "Roughness", value: 0.5, onChange: vi.fn(), min: 0, max: 1 },
                        { kind: "string", id: "name", label: "Name", value: "Material", onChange: vi.fn() },
                        { kind: "number-options", id: "mode", label: "Mode", value: 1, options: [{ label: "Opaque", value: 1 }], onChange: vi.fn() },
                        { kind: "vector2", id: "offset", label: "Offset", value: { x: 1, y: 2 }, onChange: vi.fn() },
                        { kind: "vector3", id: "normal", label: "Normal", value: { x: 0, y: 1, z: 0 }, onChange: vi.fn() },
                        { kind: "vector4", id: "plane", label: "Plane", value: { x: 0, y: 1, z: 0, w: 2 }, onChange: vi.fn() },
                        { kind: "matrix4", id: "matrix", label: "Matrix", value: [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1], onChange: vi.fn() },
                        { kind: "color", id: "albedo", label: "Albedo", value: { r: 1, g: 0.5, b: 0 }, onChange: vi.fn() },
                        { kind: "readonly", id: "family", label: "Family", value: "standard" },
                    ],
                }}
            />
        );

        expect(container.querySelector<HTMLInputElement>('input[value="Material"]')).not.toBeNull();
        expect(container.textContent).toContain("[1.00, 2.00]");
        expect(container.textContent).toContain("[0.00, 1.00, 0.00]");
        expect(container.textContent).toContain("[0.00, 1.00, 0.00, 2.00]");
        expect(container.textContent).toContain("[4 × 4]");
        expect(container.textContent).toContain("standard");

        const checkbox = container.querySelector<HTMLInputElement>('input[type="checkbox"]');
        act(() => checkbox?.click());
        expect(onBooleanChange).toHaveBeenCalledWith(false);
    });

    it("honors texture kind filtering, directional writes, navigation, and errors", () => {
        const texture2d = { id: "2d", name: "Albedo", kind: "2d" };
        const cube = { id: "cube", name: "Environment", kind: "cube" };
        const clear = vi.fn();
        const navigate = vi.fn();
        const model: MaterialTextureBindingModel<typeof cube> = {
            id: "reflection",
            label: "Reflection",
            value: cube,
            candidates: [texture2d, cube],
            getId: (texture) => texture.id,
            getDisplayName: (texture) => texture.name,
            getKind: (texture) => texture.kind,
            acceptedKinds: ["cube"],
            write: { clear },
            navigate,
            error: "Binding is stale",
        };
        const container = Render(<MaterialTextureBindingPropertyLine model={model} />);

        expect(container.querySelector('[role="alert"]')?.getAttribute("aria-label")).toBe("Reflection: Binding is stale");
        const link = Array.from(container.querySelectorAll("button")).find((element) => element.textContent?.includes("Environment"));
        expect(link).toBeDefined();
        expect(link?.getAttribute("aria-label")).toBe("Reflection: open Environment");
        expect(link?.tagName).toBe("BUTTON");
        expect(link?.tabIndex).toBe(0);
        act(() => link?.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true })));
        expect(navigate).toHaveBeenCalledWith(cube);

        const button = container.querySelector<HTMLButtonElement>("button[aria-describedby]");
        act(() => button?.click());
        expect(clear).toHaveBeenCalledOnce();
        expect(container.textContent).not.toContain("Albedo");
    });

    it("offers accepted assignment candidates without exposing an unsupported clear direction", () => {
        const texture2d = { id: "2d", name: "Albedo", kind: "2d" };
        const cube = { id: "cube", name: "Environment", kind: "cube" };
        const assign = vi.fn();
        const container = Render(
            <MaterialTextureBindingPropertyLine
                model={{
                    id: "reflection",
                    label: "Reflection",
                    value: null,
                    candidates: [texture2d, cube],
                    getId: (texture) => texture.id,
                    getDisplayName: (texture) => texture.name,
                    getKind: (texture) => texture.kind,
                    acceptedKinds: ["cube"],
                    write: { assign },
                }}
            />
        );

        const comboBox = container.querySelector<HTMLInputElement>('[role="combobox"]');
        expect(comboBox?.getAttribute("aria-label")).toBe("Reflection");
        act(() => comboBox?.click());
        const options = Array.from(document.querySelectorAll('[role="option"]'));
        expect(options.some((option) => option.textContent === "Environment")).toBe(true);
        expect(options.some((option) => option.textContent === "Albedo")).toBe(false);
        act(() => options.find((option) => option.textContent === "Environment")?.dispatchEvent(new MouseEvent("click", { bubbles: true })));
        expect(assign).toHaveBeenCalledWith(cube);
    });

    it("exposes replace without clear and disables the active binding without hiding its actions", () => {
        const texture = { id: "current", name: "Current", kind: "2d" };
        const replacement = { id: "replacement", name: "Replacement", kind: "2d" };
        const replace = vi.fn();
        const container = Render(
            <MaterialTextureBindingPropertyLine
                model={{
                    id: "lightmap",
                    label: "Lightmap",
                    value: texture,
                    candidates: [texture, replacement],
                    getId: (candidate) => candidate.id,
                    getDisplayName: (candidate) => candidate.name,
                    getKind: (candidate) => candidate.kind,
                    acceptedKinds: ["2d"],
                    write: { assign: replace },
                    pending: true,
                }}
            />
        );

        expect(container.querySelector('[aria-busy="true"]')).not.toBeNull();
        expect(container.querySelector('[aria-label="Clear Lightmap"]')).toBeNull();
        const change = container.querySelector<HTMLButtonElement>('[aria-label="Change Lightmap"]');
        expect(change).not.toBeNull();
        expect(change?.disabled).toBe(true);
        expect(container.querySelector('[role="status"]')?.textContent).toBe("Applying…");
    });

    it("renders a populated read-only binding as navigation only", () => {
        const texture = { id: "current", name: "Current", kind: "2d" };
        const navigate = vi.fn();
        const container = Render(
            <MaterialTextureBindingPropertyLine
                model={{
                    id: "readonly",
                    label: "Read-only Texture",
                    value: texture,
                    candidates: [],
                    getDisplayName: (candidate) => candidate.name,
                    getKind: (candidate) => candidate.kind,
                    acceptedKinds: ["2d"],
                    navigate,
                }}
            />
        );

        expect(container.querySelector('[aria-label="Read-only Texture: open Current"]')).not.toBeNull();
        expect(container.querySelector('[aria-label^="Clear "]')).toBeNull();
        expect(container.querySelector('[aria-label^="Change "]')).toBeNull();
        expect(container.querySelector('[role="combobox"]')).toBeNull();
    });

    it("filters candidates with runtime-neutral binding compatibility beyond texture kind", () => {
        const filterable = { id: "filterable", name: "Filterable", kind: "2d", sample: "float" };
        const depth = { id: "depth", name: "Depth", kind: "2d", sample: "depth" };
        const container = Render(
            <MaterialTextureBindingPropertyLine
                model={{
                    id: "shadow",
                    label: "Shadow Texture",
                    value: null,
                    candidates: [filterable, depth],
                    getId: (texture) => texture.id,
                    getDisplayName: (texture) => texture.name,
                    getKind: (texture) => texture.kind,
                    acceptedKinds: ["2d"],
                    isCandidateAccepted: (texture) => texture.sample === "depth",
                    write: { assign: vi.fn() },
                }}
            />
        );

        const comboBox = container.querySelector<HTMLInputElement>('[role="combobox"]')!;
        act(() => comboBox.click());
        const options = Array.from(document.querySelectorAll('[role="option"]'));
        expect(options.some((option) => option.textContent === "Depth")).toBe(true);
        expect(options.some((option) => option.textContent === "Filterable")).toBe(false);
    });

    it("announces pending state only on the initiating material control", () => {
        const container = Render(
            <MaterialPropertySection
                model={{
                    fields: [
                        { kind: "number", id: "active", label: "Active Value", value: 1, disabled: true, pending: true, onChange: vi.fn() },
                        { kind: "number", id: "idle", label: "Idle Value", value: 2, onChange: vi.fn() },
                    ],
                }}
            />
        );

        expect(container.querySelector('[aria-busy="true"]')?.textContent).toContain("Active Value");
        expect(container.querySelectorAll('[aria-busy="true"]')).toHaveLength(1);
        expect(container.querySelector('[role="status"]')?.textContent).toBe("Applying Active Value…");
        const inputs = Array.from(container.querySelectorAll<HTMLInputElement>("input"));
        expect(inputs[0].disabled).toBe(true);
        expect(inputs[1].disabled).toBe(false);
    });

    it("renders metadata-only rows and exposes row and snapshot errors accessibly", () => {
        const navigate = vi.fn();
        const container = Render(
            <TextureMetadataProperties
                model={{
                    error: "Texture unavailable",
                    pending: true,
                    rows: [
                        { id: "width", label: "Width", value: 128, units: "px" },
                        { id: "cube", label: "Cube", value: true },
                        { id: "format", label: "Format", error: "Unknown format" },
                    ],
                    transform: {
                        fields: [{ kind: "readonly", id: "transform", label: "Transform", value: "Read-only" }],
                    },
                    consumers: [{ id: "consumer", label: "Reflection", value: "Sky material", navigate }],
                }}
            />
        );

        expect(container.textContent).toContain("128 px");
        expect(container.textContent).toContain("Texture unavailable");
        expect(container.textContent).toContain("Unavailable");
        expect(container.querySelectorAll('[role="alert"]')).toHaveLength(2);
        expect(container.querySelector('[aria-label="Format: Unknown format"]')).not.toBeNull();
        expect(container.querySelector('[aria-busy="true"]')).not.toBeNull();
        const consumer = container.querySelector('[aria-label="Open material Sky material, Reflection"]');
        act(() => consumer?.dispatchEvent(new MouseEvent("click", { bubbles: true })));
        expect(navigate).toHaveBeenCalledOnce();
        expect(container.querySelector("canvas")).toBeNull();
        expect(container.querySelector('input[type="file"]')).toBeNull();
    });

    it("exposes matching controlled material field models for Babylon.js and Lite", () => {
        const onChange = vi.fn();
        const boolean = { id: "enabled", label: "Enabled", value: true, onChange };
        const number = { id: "level", label: "Level", value: 0.5, onChange, min: 0, max: 1 };
        expect(CreateBabylonBooleanModel(boolean)).toEqual(CreateLiteBooleanModel(boolean));
        expect(CreateBabylonNumberModel(number)).toEqual(CreateLiteNumberModel(number));

        const babylonColorChange = vi.fn();
        const liteColorChange = vi.fn();
        const babylonColor = CreateBabylonColorModel({
            id: "color",
            label: "Color",
            value: new Color3(0.1, 0.2, 0.3),
            onChange: babylonColorChange,
            linear: true,
        });
        const liteColor = CreateLiteColorModel({
            id: "color",
            label: "Color",
            value: [0.1, 0.2, 0.3],
            onChange: liteColorChange,
            linear: true,
        });
        expect(babylonColor.kind).toBe("color");
        expect(liteColor.kind).toBe("color");
        if (babylonColor.kind !== "color" || liteColor.kind !== "color") {
            throw new Error("Expected color material models.");
        }
        expect(babylonColor.value).toEqual(liteColor.value);
        babylonColor.onChange({ r: 0.4, g: 0.5, b: 0.6 });
        liteColor.onChange({ r: 0.4, g: 0.5, b: 0.6 });
        expect(babylonColorChange).toHaveBeenCalledWith(new Color3(0.4, 0.5, 0.6));
        expect(liteColorChange).toHaveBeenCalledWith([0.4, 0.5, 0.6]);
    });

    it("keeps P4 shared cores isolated from Babylon runtimes and preview dependencies", () => {
        const root = resolve(import.meta.dirname, "../../..");
        const files = [
            "sharedUiComponents/src/fluent/hoc/propertyLines/materialPropertyLine.tsx",
            "sharedUiComponents/src/fluent/hoc/propertyLines/materialPropertyAdaptersCore.ts",
            "sharedUiComponents/src/fluent/hoc/propertyLines/materialTextureBindingPropertyLine.tsx",
            "sharedUiComponents/src/fluent/hoc/propertyLines/textureMetadataProperties.tsx",
        ];

        for (const file of files) {
            const source = readFileSync(`${root}/${file}`, "utf8");
            expect(source).not.toMatch(/from ["'](?:@babylonjs\/lite|core\/|@dev\/core)/);
            expect(source).not.toMatch(/texture(?:Preview|Editor|Upload)/i);
        }
    });
});
