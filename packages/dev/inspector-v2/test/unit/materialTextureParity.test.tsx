/**
 * @vitest-environment jsdom
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { FluentProvider, webLightTheme } from "@fluentui/react-components";
import { act, type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";

import { MaterialTextureBindingPropertyLine, type MaterialTextureBindingProps } from "shared-ui-components/fluent/hoc/propertyLines/materialTextureBindingPropertyLine";
import { ToolContext } from "shared-ui-components/fluent/hoc/fluentToolWrapper";
import { EntitySelector } from "shared-ui-components/fluent/primitives/entitySelector";

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
        const bindingProps: MaterialTextureBindingProps<typeof cube> = {
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
        const container = Render(<MaterialTextureBindingPropertyLine {...bindingProps} />);

        expect(container.querySelector('[role="alert"]')?.getAttribute("aria-label")).toBe("Reflection: Binding is stale");
        const link = Array.from(container.querySelectorAll("button")).find((element) => element.textContent?.includes("Environment"));
        expect(link).toBeDefined();
        expect(link?.getAttribute("aria-label")).toBe("Reflection: open Environment");
        expect(link?.tagName).toBe("BUTTON");
        expect(link?.tabIndex).toBe(0);
        act(() => link?.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true })));
        expect(navigate).toHaveBeenCalledWith(cube);

        const button = container.querySelector<HTMLButtonElement>('[aria-label="Clear Reflection"]');
        act(() => button?.click());
        expect(clear).toHaveBeenCalledOnce();
        expect(container.querySelector('[aria-label="Change Reflection"]')).toBeNull();
        expect(container.textContent).not.toContain("Albedo");
    });

    it("offers one unlink action before selecting a new texture", () => {
        const first = { id: "first", name: "First", kind: "2d" };
        const second = { id: "second", name: "Second", kind: "2d" };
        const assign = vi.fn();
        const clear = vi.fn();
        const props: MaterialTextureBindingProps<typeof first> = {
            id: "diffuse",
            label: "Diffuse",
            value: first,
            candidates: [first, second],
            getId: (texture) => texture.id,
            getDisplayName: (texture) => texture.name,
            getKind: (texture) => texture.kind,
            acceptedKinds: ["2d"],
            write: { assign, clear },
        };
        const container = Render(<MaterialTextureBindingPropertyLine {...props} />);

        expect(container.querySelector('[aria-label="Clear Diffuse"]')).not.toBeNull();
        expect(container.querySelector('[aria-label="Change Diffuse"]')).toBeNull();
        act(() => container.querySelector<HTMLButtonElement>('[aria-label="Clear Diffuse"]')?.click());
        expect(clear).toHaveBeenCalledOnce();
        act(() =>
            roots[roots.length - 1].render(
                <FluentProvider theme={webLightTheme}>
                    <MaterialTextureBindingPropertyLine {...props} value={null} />
                </FluentProvider>
            )
        );
        const comboBox = container.querySelector<HTMLInputElement>('[role="combobox"]');
        expect(comboBox?.getAttribute("aria-label")).toBe("Diffuse");
        act(() => comboBox?.click());
        const options = Array.from(document.querySelectorAll('[role="option"]'));
        act(() => options.find((option) => option.textContent === "Second")?.dispatchEvent(new MouseEvent("click", { bubbles: true })));
        expect(assign).toHaveBeenCalledWith(second);
    });

    it("keeps the Babylon entity selector's one-button unlink or edit behavior", () => {
        const first = { uniqueId: 1, name: "Shared" };
        const second = { uniqueId: 2, name: "Shared" };
        const onChange = vi.fn();
        const onLink = vi.fn();
        const getEntities = () => [first, second];
        const getName = (entity: typeof first) => entity.name;
        const container = Render(<EntitySelector value={first} onChange={onChange} onLink={onLink} defaultValue={null} getEntities={getEntities} getName={getName} />);

        expect(container.querySelector('[aria-label="Unlink"]')).not.toBeNull();
        expect(container.querySelector('[aria-label="Edit Link"]')).toBeNull();
        act(() => container.querySelector<HTMLButtonElement>('[aria-label="Unlink"]')?.click());
        expect(onChange).toHaveBeenCalledWith(null);
        act(() =>
            roots[roots.length - 1].render(
                <FluentProvider theme={webLightTheme}>
                    <EntitySelector value={null} onChange={onChange} onLink={onLink} defaultValue={null} getEntities={getEntities} getName={getName} />
                </FluentProvider>
            )
        );
        expect(container.querySelector('[role="combobox"]')).not.toBeNull();

        act(() =>
            roots[roots.length - 1].render(
                <FluentProvider theme={webLightTheme}>
                    <EntitySelector value={first} onChange={onChange} onLink={onLink} getEntities={getEntities} getName={getName} />
                </FluentProvider>
            )
        );
        expect(container.querySelector('[aria-label="Unlink"]')).toBeNull();
        expect(container.querySelector('[aria-label="Edit Link"]')).not.toBeNull();
        act(() => container.querySelector<HTMLButtonElement>('[aria-label="Edit Link"]')?.click());
        act(() => container.querySelector<HTMLInputElement>('[role="combobox"]')?.click());
        const options = Array.from(document.querySelectorAll('[role="option"]'));
        expect(options).toHaveLength(2);
        act(() => options[1].dispatchEvent(new MouseEvent("click", { bubbles: true })));
        expect(onChange).toHaveBeenCalledWith(second);
    });

    it("sizes selector popup options with compact mode without changing normal mode", () => {
        const texture = { uniqueId: 1, name: "Texture" };
        const selector = <EntitySelector value={null} onChange={vi.fn()} onLink={vi.fn()} getEntities={() => [texture]} getName={(entity) => entity.name} />;
        const container = Render(<ToolContext.Provider value={{ useFluent: true, disableCopy: false, toolName: "", size: "small" }}>{selector}</ToolContext.Provider>);

        act(() => container.querySelector<HTMLInputElement>('[role="combobox"]')?.click());
        const compactOption = document.querySelector<HTMLElement>('[role="option"]');
        const compactOptionClass = compactOption?.className;
        expect(compactOption).not.toBeNull();
        expect(
            Array.from(document.styleSheets).some((sheet) =>
                Array.from(sheet.cssRules).some(
                    (rule) => rule.cssText.includes("var(--fontSizeBase200)") && compactOptionClass?.split(" ").some((className) => rule.cssText.includes(`.${className}`))
                )
            )
        ).toBe(true);

        act(() =>
            roots[roots.length - 1].render(
                <FluentProvider theme={webLightTheme}>
                    <ToolContext.Provider value={{ useFluent: true, disableCopy: false, toolName: "", size: "medium" }}>{selector}</ToolContext.Provider>
                </FluentProvider>
            )
        );
        const normalOption = document.querySelector<HTMLElement>('[role="option"]');
        expect(normalOption).not.toBeNull();
        expect(normalOption?.parentElement?.className).toBe(compactOption?.parentElement?.className);
        expect(normalOption?.className).not.toBe(compactOptionClass);
    });

    it("offers accepted assignment candidates without exposing an unsupported clear direction", () => {
        const texture2d = { id: "2d", name: "Albedo", kind: "2d" };
        const cube = { id: "cube", name: "Environment", kind: "cube" };
        const assign = vi.fn();
        const container = Render(
            <MaterialTextureBindingPropertyLine
                id="reflection"
                label="Reflection"
                value={null}
                candidates={[texture2d, cube]}
                getId={(texture) => texture.id}
                getDisplayName={(texture) => texture.name}
                getKind={(texture) => texture.kind}
                acceptedKinds={["cube"]}
                write={{ assign }}
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
                id="lightmap"
                label="Lightmap"
                value={texture}
                candidates={[texture, replacement]}
                getId={(candidate) => candidate.id}
                getDisplayName={(candidate) => candidate.name}
                getKind={(candidate) => candidate.kind}
                acceptedKinds={["2d"]}
                write={{ assign: replace }}
                pending
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
                id="readonly"
                label="Read-only Texture"
                value={texture}
                candidates={[]}
                getDisplayName={(candidate) => candidate.name}
                getKind={(candidate) => candidate.kind}
                acceptedKinds={["2d"]}
                navigate={navigate}
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
                id="shadow"
                label="Shadow Texture"
                value={null}
                candidates={[filterable, depth]}
                getId={(texture) => texture.id}
                getDisplayName={(texture) => texture.name}
                getKind={(texture) => texture.kind}
                acceptedKinds={["2d"]}
                isCandidateAccepted={(texture) => texture.sample === "depth"}
                write={{ assign: vi.fn() }}
            />
        );

        const comboBox = container.querySelector<HTMLInputElement>('[role="combobox"]')!;
        act(() => comboBox.click());
        const options = Array.from(document.querySelectorAll('[role="option"]'));
        expect(options.some((option) => option.textContent === "Depth")).toBe(true);
        expect(options.some((option) => option.textContent === "Filterable")).toBe(false);
    });

    it("keeps P4 shared cores isolated from Babylon runtimes and preview dependencies", () => {
        const root = resolve(import.meta.dirname, "../../..");
        const files = [
            "sharedUiComponents/src/fluent/hoc/propertyLines/colorPropertyLineCore.tsx",
            "sharedUiComponents/src/fluent/hoc/propertyLines/vectorPropertyLineCore.tsx",
            "sharedUiComponents/src/fluent/hoc/propertyLines/materialTextureBindingPropertyLine.tsx",
            "sharedUiComponents/src/fluent/primitives/resourceSelector.tsx",
        ];

        for (const file of files) {
            const source = readFileSync(`${root}/${file}`, "utf8");
            expect(source).not.toMatch(/from ["'](?:@babylonjs\/lite|core\/|@dev\/core)/);
            expect(source).not.toMatch(/texture(?:Preview|Editor|Upload)/i);
        }
    });
});
