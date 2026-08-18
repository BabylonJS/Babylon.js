import { type Camera } from "core/Cameras/camera";
import { Logger } from "core/Misc/logger";
import { createElement, type ComponentProps, type FunctionComponent } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { type InspectorV2Module } from "../../src/globalState";
import { CameraPresetNameMaxLength, type CameraPresetManager } from "../../src/tools/cameraPresetManager";
import { TryMakeCameraPresetInspectorServiceDefinition } from "../../src/tools/cameraPresetInspectorService";

type DisposableService = { dispose(): void };
type TextInputPropertyLineProps = ComponentProps<InspectorV2Module["TextInputPropertyLine"]>;

interface ICameraPresetSectionDefinition {
    content: Array<{ component: FunctionComponent<{ context: Camera }> }>;
}

function CreateInspectorModule(textInputPropertyLine: InspectorV2Module["TextInputPropertyLine"] = () => null): InspectorV2Module {
    return {
        ShowInspector: vi.fn(),
        PropertiesServiceIdentity: Symbol("PropertiesService"),
        SelectionServiceIdentity: Symbol("SelectionService"),
        TextInputPropertyLine: textInputPropertyLine,
        ButtonLine: () => null,
    } as unknown as InspectorV2Module;
}

function CreateServiceFactory() {
    const definition = TryMakeCameraPresetInspectorServiceDefinition({} as CameraPresetManager, CreateInspectorModule());
    if (!definition) {
        throw new Error("Expected a compatible Inspector service definition");
    }
    return definition.factory as (propertiesService: unknown, selectionService: unknown) => DisposableService;
}

afterEach(() => {
    vi.restoreAllMocks();
});

describe("Sandbox camera preset Inspector compatibility", () => {
    it("builds a contribution for a complete Inspector module", () => {
        const inspectorModule = CreateInspectorModule();

        const definition = TryMakeCameraPresetInspectorServiceDefinition({} as CameraPresetManager, inspectorModule);

        expect(definition).toMatchObject({
            friendlyName: "Sandbox Camera Preset Properties",
            consumes: [inspectorModule.PropertiesServiceIdentity, inspectorModule.SelectionServiceIdentity],
        });
    });

    it("forwards the preset name limit to the Inspector text input", () => {
        const textInputPropertyLine = vi.fn((_props: TextInputPropertyLineProps) => null);
        const inspectorModule = CreateInspectorModule(textInputPropertyLine);
        const definition = TryMakeCameraPresetInspectorServiceDefinition({} as CameraPresetManager, inspectorModule);
        if (!definition) {
            throw new Error("Expected a compatible Inspector service definition");
        }

        let cameraPresetSection: FunctionComponent<{ context: Camera }> | undefined;
        const factory = definition.factory as (propertiesService: unknown, selectionService: unknown) => DisposableService;
        const instance = factory(
            {
                addSection: vi.fn(() => ({ dispose: vi.fn() })),
                addSectionContent: vi.fn((sectionDefinition: ICameraPresetSectionDefinition) => {
                    cameraPresetSection = sectionDefinition.content[0]?.component;
                    return { dispose: vi.fn() };
                }),
            },
            {
                selectedEntity: null,
                onSelectedEntityChanged: { add: vi.fn(() => ({ remove: vi.fn() })) },
            }
        );
        if (!cameraPresetSection) {
            throw new Error("Expected the camera preset Inspector section to be registered");
        }

        renderToStaticMarkup(createElement(cameraPresetSection, { context: {} as Camera }));

        expect(textInputPropertyLine).toHaveBeenCalledOnce();
        expect(textInputPropertyLine.mock.calls[0][0]).toMatchObject({ label: "Name", maxLength: CameraPresetNameMaxLength });
        instance.dispose();
    });

    it.each(["ShowInspector", "PropertiesServiceIdentity", "SelectionServiceIdentity", "TextInputPropertyLine", "ButtonLine"] as const)(
        "does not build a contribution without %s",
        (property) => {
            const inspectorModule = CreateInspectorModule() as unknown as Record<string, unknown>;
            inspectorModule[property] = undefined;

            expect(TryMakeCameraPresetInspectorServiceDefinition({} as CameraPresetManager, inspectorModule)).toBeUndefined();
        }
    );

    it("returns a safe no-op service for incompatible consumed services and warns once", () => {
        const warn = vi.spyOn(Logger, "Warn").mockImplementation(() => {});
        const factory = CreateServiceFactory();
        const instances: DisposableService[] = [];

        expect(() => {
            instances.push(factory({}, {}));
            instances.push(factory({ addSection: vi.fn(), addSectionContent: vi.fn() }, { selectedEntity: null, onSelectedEntityChanged: { add: undefined } }));
        }).not.toThrow();
        expect(() => instances.forEach((instance) => instance.dispose())).not.toThrow();
        expect(warn).toHaveBeenCalledOnce();
        expect(warn.mock.calls[0][0]).toContain("loaded Inspector services");
    });

    it("does not read the selected entity while rejecting an incompatible selection service", () => {
        vi.spyOn(Logger, "Warn").mockImplementation(() => {});
        const readSelectedEntity = vi.fn();
        const factory = CreateServiceFactory();
        const selectionService = {
            get selectedEntity() {
                readSelectedEntity();
                return null;
            },
            onSelectedEntityChanged: { add: undefined },
        };

        factory({ addSection: vi.fn(), addSectionContent: vi.fn() }, selectionService);

        expect(readSelectedEntity).not.toHaveBeenCalled();
    });

    it("disposes partial registrations when a later registration fails", () => {
        const warn = vi.spyOn(Logger, "Warn").mockImplementation(() => {});
        const presetSectionDispose = vi.fn();
        const observerRemove = vi.fn();
        const factory = CreateServiceFactory();
        const propertiesService = {
            addSection: vi.fn(() => ({ dispose: presetSectionDispose })),
            addSectionContent: vi.fn(() => {
                throw new Error("Unsupported section content");
            }),
        };
        const selectionService = {
            selectedEntity: null,
            onSelectedEntityChanged: { add: vi.fn(() => ({ remove: observerRemove })) },
        };

        let instance: DisposableService | undefined;
        expect(() => {
            instance = factory(propertiesService, selectionService);
        }).not.toThrow();

        expect(observerRemove).toHaveBeenCalledOnce();
        expect(presetSectionDispose).toHaveBeenCalledOnce();
        expect(warn).toHaveBeenCalledOnce();
        expect(warn.mock.calls[0][0]).toContain("Unsupported section content");
        expect(() => instance?.dispose()).not.toThrow();
    });

    it("removes an observer returned after a synchronous selection callback fails", () => {
        vi.spyOn(Logger, "Warn").mockImplementation(() => {});
        const presetSectionDispose = vi.fn();
        const observerRemove = vi.fn();
        const factory = CreateServiceFactory();
        const camera = { getScene: () => ({ cameras: [camera] }) };
        const propertiesService = {
            addSection: vi.fn().mockReturnValueOnce({ dispose: presetSectionDispose }).mockReturnValueOnce(undefined),
            addSectionContent: vi.fn(),
        };
        const selectionService = {
            selectedEntity: camera,
            onSelectedEntityChanged: {
                add: vi.fn((callback: () => void) => {
                    callback();
                    return { remove: observerRemove };
                }),
            },
        };

        const instance = factory(propertiesService, selectionService);

        expect(observerRemove).toHaveBeenCalledOnce();
        expect(presetSectionDispose).toHaveBeenCalledOnce();
        expect(() => instance.dispose()).not.toThrow();
    });
});
