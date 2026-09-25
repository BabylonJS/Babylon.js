/**
 * @vitest-environment jsdom
 */

import { FluentProvider, webLightTheme } from "@fluentui/react-components";
import { NullEngine } from "core/Engines/nullEngine";
import { StandardMaterial } from "core/Materials/standardMaterial";
import { Color3 } from "core/Maths/math.color";
import { Observable } from "core/Misc/observable";
import { Scene } from "core/scene";
import { act, type FunctionComponent } from "react";
import { createRoot } from "react-dom/client";
import { describe, expect, it, vi } from "vitest";

import { MaterialPropertySection, type MaterialPropertySectionModel } from "shared-ui-components/fluent/hoc/propertyLines/materialPropertyLine";
import { useMaterialPropertySectionModel } from "../../src/components/properties/materials/materialPropertySectionModel";
import { PropertyContext, type PropertyChangeInfo } from "../../src/contexts/propertyContext";

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

describe("Babylon.js material property section model", () => {
    it("observes assignments and in-place color edits, and preserves property-change notifications", () => {
        const engine = new NullEngine();
        const scene = new Scene(engine);
        const material = new StandardMaterial("Test", scene);
        const onPropertyChanged = new Observable<PropertyChangeInfo>();
        const notify = vi.fn();
        onPropertyChanged.add(notify);
        const container = document.createElement("div");
        document.body.appendChild(container);
        const root = createRoot(container);
        let model: MaterialPropertySectionModel = { fields: [] };
        let nextMaterial: StandardMaterial | undefined;

        const Probe: FunctionComponent<{ material: StandardMaterial }> = (props) => {
            const { material } = props;
            model = useMaterialPropertySectionModel(material);
            return <MaterialPropertySection model={model} />;
        };
        const getColor = (id: string) => {
            const field = model.fields.find((item) => item.id === id);
            if (field?.kind !== "color") {
                throw new Error(`Expected color field ${id}.`);
            }
            return field;
        };
        const getPower = () => {
            const field = model.fields.find((item) => item.id === "Specular Power");
            if (field?.kind !== "number") {
                throw new Error("Expected specular power field.");
            }
            return field;
        };

        const renderMaterial = (selected: StandardMaterial) =>
            act(() =>
                root.render(
                    <FluentProvider theme={webLightTheme}>
                        <PropertyContext.Provider value={{ onPropertyChanged }}>
                            <Probe material={selected} />
                        </PropertyContext.Provider>
                    </FluentProvider>
                )
            );

        try {
            renderMaterial(material);
            expect(model.fields.map((field) => field.label)).toEqual(["Diffuse Color", "Specular Color", "Specular Power", "Emissive Color", "Ambient Color"]);
            expect(container.textContent).toContain("Specular Power");
            expect(getPower()).toMatchObject({ min: 0, max: 128, step: 0.1 });

            act(() => {
                material.specularPower = 32;
                material.diffuseColor = new Color3(0.1, 0.2, 0.3);
            });
            expect(getPower().value).toBe(32);
            expect(getColor("Diffuse Color").value).toEqual({ r: 0.1, g: 0.2, b: 0.3 });

            act(() => {
                material.diffuseColor.g = 0.6;
            });
            expect(getColor("Diffuse Color").value).toEqual({ r: 0.1, g: 0.6, b: 0.3 });

            act(() => getColor("Diffuse Color").onChange({ r: 0.4, g: 0.5, b: 0.6 }));
            expect(material.diffuseColor).toEqual(new Color3(0.4, 0.5, 0.6));
            expect(notify).toHaveBeenCalledWith(expect.objectContaining({ entity: material, propertyKey: "diffuseColor", newValue: material.diffuseColor }), expect.anything());
            act(() => getPower().onChange(64));
            expect(material.specularPower).toBe(64);
            expect(notify).toHaveBeenCalledWith(expect.objectContaining({ entity: material, propertyKey: "specularPower", oldValue: 32, newValue: 64 }), expect.anything());

            const replacement = new StandardMaterial("Next", scene);
            nextMaterial = replacement;
            replacement.specularPower = 16;
            renderMaterial(replacement);
            expect(getPower().value).toBe(16);
            act(() => {
                material.specularPower = 48;
                replacement.specularPower = 24;
            });
            expect(getPower().value).toBe(24);
        } finally {
            act(() => root.unmount());
            container.remove();
            nextMaterial?.dispose();
            material.dispose();
            scene.dispose();
            engine.dispose();
        }
    });
});
