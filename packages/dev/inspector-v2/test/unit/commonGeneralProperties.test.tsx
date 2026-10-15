/**
 * @vitest-environment jsdom
 */

import { FluentProvider, webLightTheme } from "@fluentui/react-components";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.hoisted(() => {
    vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
    vi.stubGlobal(
        "matchMedia",
        vi.fn(() => ({ matches: false }))
    );
});

import { CommonGeneralProperties } from "../../src/components/properties/commonGeneralProperties";

describe("CommonGeneralProperties", () => {
    const roots: Root[] = [];
    const containers: HTMLElement[] = [];

    afterEach(() => {
        roots.splice(0).forEach((root) => act(() => root.unmount()));
        containers.splice(0).forEach((container) => container.remove());
    });

    function Render(commonEntity: Parameters<typeof CommonGeneralProperties>[0]["commonEntity"]): HTMLElement {
        const container = document.createElement("div");
        document.body.appendChild(container);
        containers.push(container);
        const root = createRoot(container);
        roots.push(root);
        act(() =>
            root.render(
                <FluentProvider theme={webLightTheme}>
                    <CommonGeneralProperties commonEntity={commonEntity} />
                </FluentProvider>
            )
        );
        return container;
    }

    function GetPropertyLineValue(container: HTMLElement, label: string): string | undefined {
        const valueContainers = Array.from(container.querySelectorAll<HTMLElement>('[id="property"]'));
        const valueContainer = valueContainers.find((element) => element.parentElement?.firstElementChild?.textContent?.trim() === label);
        return valueContainer ? (valueContainer.textContent ?? "") : undefined;
    }

    it("renders an Unknown Class row for a name-only entity", () => {
        const container = Render({ name: "Material" });

        expect(GetPropertyLineValue(container, "Class")).toBe("Unknown");
    });

    it("renders a supplied class name", () => {
        const container = Render({ name: "Material", getClassName: () => "StandardMaterial" });

        expect(GetPropertyLineValue(container, "Class")).toBe("StandardMaterial");
    });

    it("keeps an empty class name instead of falling back", () => {
        const container = Render({ name: "Material", getClassName: () => "" });

        expect(GetPropertyLineValue(container, "Class")).toBe("");
    });
});
