/**
 * @vitest-environment jsdom
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { FluentProvider, webLightTheme } from "@fluentui/react-components";
import { act, type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";

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
                    consumers: [{ id: "consumer", label: "Reflection", value: "Sky material", navigate }],
                }}
                transform={<div>Read-only transform</div>}
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

    it("keeps P4 shared cores isolated from Babylon runtimes and preview dependencies", () => {
        const root = resolve(import.meta.dirname, "../../..");
        const files = [
            "sharedUiComponents/src/fluent/hoc/propertyLines/colorPropertyLineCore.tsx",
            "sharedUiComponents/src/fluent/hoc/propertyLines/vectorPropertyLineCore.tsx",
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
