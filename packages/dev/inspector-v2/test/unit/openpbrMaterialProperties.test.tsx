/**
 * @vitest-environment jsdom
 */

import { FluentProvider, webLightTheme } from "@fluentui/react-components";
import { NullEngine } from "core/Engines/nullEngine";
import { OpenPBRMaterial } from "core/Materials/PBR/openpbrMaterial";
import { Texture } from "core/Materials/Textures/texture";
import { Scene } from "core/scene";
import { act, Children, isValidElement, type ReactElement, type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { OpenPBRMaterialSpecularProperties } from "../../src/components/properties/materials/openpbrMaterialProperties";

vi.hoisted(() => {
    vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
    vi.stubGlobal(
        "matchMedia",
        vi.fn(() => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() }))
    );
});

type PropertyElement = ReactElement<{ children?: ReactNode; propertyKey?: string; propertyName?: string }>;

function FindProperties(node: ReactNode, property: string): PropertyElement[] {
    return Children.toArray(node).flatMap((child) => {
        if (!isValidElement<PropertyElement["props"]>(child)) {
            return [];
        }
        if (child.props.propertyKey === property || child.props.propertyName === property) {
            return [child];
        }
        return FindProperties(child.props.children, property);
    });
}

describe("OpenPBR Inspector retroreflection controls", () => {
    let engine: NullEngine;
    let scene: Scene;
    let material: OpenPBRMaterial;
    let container: HTMLDivElement;
    let root: Root;

    beforeEach(() => {
        engine = new NullEngine();
        scene = new Scene(engine);
        material = new OpenPBRMaterial("retroreflection", scene);
        container = document.createElement("div");
        document.body.appendChild(container);
        root = createRoot(container);
    });

    afterEach(() => {
        act(() => root.unmount());
        container.remove();
        scene.dispose();
        engine.dispose();
    });

    it("binds the current Inspector's bounded factor slider and editable texture", () => {
        material.specularRetroreflectivity = 0.25;
        const properties = OpenPBRMaterialSpecularProperties({ material });
        const factors = FindProperties(properties, "specularRetroreflectivity");
        const textures = FindProperties(properties, "specularRetroreflectivityTexture");
        expect(factors).toHaveLength(1);
        expect(textures).toHaveLength(1);
        expect(factors[0].props).toMatchObject({ target: material, min: 0, max: 1, step: 0.01 });
        expect(textures[0].props).toMatchObject({ target: material, material, scene, defaultValue: null });

        act(() => root.render(<FluentProvider theme={webLightTheme}>{factors[0]}</FluentProvider>));
        const slider = container.querySelector<HTMLInputElement>('input[type="range"]')!;
        expect(slider).not.toBeNull();
        expect(slider.value).toBe("25");
        act(() => {
            Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(slider, "75");
            slider.dispatchEvent(new Event("input", { bubbles: true }));
            slider.dispatchEvent(new Event("change", { bubbles: true }));
        });
        expect(material.specularRetroreflectivity).toBe(0.75);

        const texture = new Texture(null, scene);
        texture.name = "Retroreflection mask";
        material.specularRetroreflectivityTexture = texture;
        act(() => root.render(<FluentProvider theme={webLightTheme}>{textures[0]}</FluentProvider>));
        expect(container.textContent).toContain(texture.name);
        const unlink = container.querySelector<HTMLButtonElement>('[aria-label="Unlink"]');
        expect(unlink).not.toBeNull();
        act(() => unlink!.click());
        expect(material.specularRetroreflectivityTexture).toBeNull();
        expect(container.querySelector('[role="combobox"]')).not.toBeNull();
        act(() => container.querySelector<HTMLInputElement>('[role="combobox"]')!.click());
        const option = Array.from(document.querySelectorAll('[role="option"]')).find((element) => element.textContent === texture.name);
        expect(option).toBeDefined();
        act(() => option!.dispatchEvent(new MouseEvent("click", { bubbles: true })));
        expect(material.specularRetroreflectivityTexture).toBe(texture);
    });
});
