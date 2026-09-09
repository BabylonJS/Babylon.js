/**
 * @vitest-environment jsdom
 */

import {
    type EngineContext,
    type Material,
    type Mesh,
    type RenderingContext,
    type SceneContext,
    type SpriteRenderer,
    type SurfaceContext,
    type TextLayer,
    type TextRenderer,
    type Texture2D,
} from "@babylonjs/lite";
import { FluentProvider, webLightTheme } from "@fluentui/react-components";
import { act, Children, isValidElement, type Context, type FunctionComponent, type ReactElement, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.hoisted(() => {
    vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
    vi.stubGlobal(
        "matchMedia",
        vi.fn(() => ({ matches: false }))
    );
});

import { Observable } from "core/Misc/observable";
import { type IReactContextService, type ReactContextHandle } from "shared-ui-components/modularTool/services/reactContextService";
import { type ISettingsStore, type SettingDescriptor } from "shared-ui-components/modularTool/services/settingsStore";
import { BoundProperty } from "../../src/components/properties/boundProperty";
import { WatcherContext } from "../../src/contexts/watcherContext";
import { EngineContextIdentity, type IEngineContext } from "../../src/lite/engineContext";
import { EnginePropertiesServiceDefinition } from "../../src/lite/services/panes/properties/enginePropertiesService";
import { MaterialPropertiesServiceDefinition } from "../../src/lite/services/panes/properties/materialPropertiesService";
import { RenderingContextPropertiesServiceDefinition } from "../../src/lite/services/panes/properties/renderingContextPropertiesService";
import { TextLayerPropertiesServiceDefinition } from "../../src/lite/services/panes/properties/textLayerPropertiesService";
import { TexturePropertiesServiceDefinition } from "../../src/lite/services/panes/properties/texturePropertiesService";
import { type IPropertiesService, PropertiesServiceIdentity } from "../../src/services/panes/properties/propertiesService";
import { MakeWatcherServiceDefinitions } from "../../src/services/watcherService";

type RegisteredContent = Parameters<IPropertiesService["addSectionContent"]>[0];

class TestSettingsStore implements ISettingsStore {
    private readonly _onChanged = new Observable<string>();
    private readonly _values = new Map<string, unknown>();

    public get onChanged() {
        return this._onChanged;
    }

    public readSetting<T>(descriptor: SettingDescriptor<T>): T {
        return this._values.has(descriptor.key) ? (this._values.get(descriptor.key) as T) : descriptor.defaultValue;
    }

    public writeSetting<T>(descriptor: SettingDescriptor<T>, value: T): void {
        this._values.set(descriptor.key, value);
        this._onChanged.notifyObservers(descriptor.key);
    }
}

class TestReactContextService implements IReactContextService {
    public addContext<T>(_provider: Context<T>["Provider"], _initialValue: T): ReactContextHandle<T> {
        return {
            updateValue: () => {},
            dispose: () => {},
        };
    }
}

function GetNormalizedText(container: HTMLElement): string {
    return container.textContent?.replace(/\s/g, "") ?? "";
}

describe("Babylon Lite properties services", () => {
    afterEach(() => {
        vi.useRealTimers();
    });

    it("registers applicable content for every non-mesh Explorer entity", () => {
        const scene = {
            _kind: "scene",
            meshes: [],
            lights: [],
            animationGroups: [],
            shadowGenerators: [],
            fixedDeltaMs: 0,
        } as unknown as SceneContext;
        Object.preventExtensions(scene);
        const textLayer = {
            data: {
                runs: [
                    {
                        glyphs: [{}, {}],
                    },
                ],
            },
            positionPx: { x: 10, y: 20 },
            rotationRad: 0,
            scale: 1,
            order: 0,
            opacity: 1,
            coverageGamma: 2,
            visible: true,
        } as unknown as TextLayer;
        const textRenderer = { _kind: "text-renderer", layers: [textLayer] } as unknown as TextRenderer;
        const spriteRenderer = { _kind: "sprite-renderer", layers: [] } as unknown as SpriteRenderer;
        const auxiliarySurface = {
            canvas: { width: 320, height: 200 },
            format: "bgra8unorm",
            msaaSamples: 4,
            maxDevicePixelRatio: 2,
            _renderingContexts: [textRenderer, spriteRenderer],
        } as unknown as SurfaceContext;
        const engine = {
            surfaces: [] as unknown as EngineContext["surfaces"],
            canvas: { width: 640, height: 480 },
            format: "bgra8unorm",
            msaaSamples: 4,
            maxDevicePixelRatio: Infinity,
            drawCallCount: 3,
            gpuFrameTimeMs: 1.5,
            useHighPrecisionMatrix: false,
            useFloatingOrigin: false,
            _renderingContexts: [scene],
        } as unknown as EngineContext;
        (engine as { surfaces: readonly SurfaceContext[] }).surfaces = [engine, auxiliarySurface];

        const material = {
            name: "Material",
            _buildGroup: { _materialFamily: "standard" },
            _uboVersion: 0,
        } as unknown as Material;
        const texture = {
            texture: {},
            view: {},
            sampler: {},
            width: 16,
            height: 8,
            invertY: true,
        } as unknown as Texture2D;
        const registrations = new Map<string, RegisteredContent>();
        const disposals: ReturnType<typeof vi.fn>[] = [];
        const propertiesService = {
            addSectionContent: vi.fn((content: RegisteredContent) => {
                registrations.set(content.key, content);
                const dispose = vi.fn();
                disposals.push(dispose);
                return { dispose };
            }),
        } as unknown as IPropertiesService;
        const engineContext = { engine } as IEngineContext;

        const services = [
            EnginePropertiesServiceDefinition.factory(propertiesService, engineContext),
            RenderingContextPropertiesServiceDefinition.factory(propertiesService, engineContext),
            MaterialPropertiesServiceDefinition.factory(propertiesService),
            TexturePropertiesServiceDefinition.factory(propertiesService),
            TextLayerPropertiesServiceDefinition.factory(propertiesService, engineContext),
        ];

        expect(EnginePropertiesServiceDefinition.consumes).toEqual([PropertiesServiceIdentity, EngineContextIdentity]);
        expect(RenderingContextPropertiesServiceDefinition.consumes).toEqual([PropertiesServiceIdentity, EngineContextIdentity]);
        expect(MaterialPropertiesServiceDefinition.consumes).toEqual([PropertiesServiceIdentity]);
        expect(TexturePropertiesServiceDefinition.consumes).toEqual([PropertiesServiceIdentity]);
        expect(TextLayerPropertiesServiceDefinition.consumes).toEqual([PropertiesServiceIdentity, EngineContextIdentity]);
        expect(registrations.size).toBe(8);

        expect(registrations.get("Babylon Lite Engine Properties")?.predicate(engine)).toBe(true);
        expect(registrations.get("Babylon Lite Engine Properties")?.predicate(auxiliarySurface)).toBe(false);
        expect(registrations.get("Babylon Lite Surface Properties")?.predicate(auxiliarySurface)).toBe(true);
        expect(registrations.get("Babylon Lite Surface Properties")?.predicate(engine)).toBe(false);
        expect(registrations.get("Babylon Lite Scene Properties")?.predicate(scene)).toBe(true);
        expect(registrations.get("Babylon Lite Text Renderer Properties")?.predicate(textRenderer)).toBe(true);
        expect(registrations.get("Babylon Lite Sprite Renderer Properties")?.predicate(spriteRenderer)).toBe(true);
        expect(registrations.get("Babylon Lite Material Properties")?.predicate(material)).toBe(true);
        expect(registrations.get("Babylon Lite Texture Properties")?.predicate(texture)).toBe(true);
        expect(registrations.get("Babylon Lite Text Layer Properties")?.predicate(textLayer)).toBe(true);

        const sceneContent = registrations.get("Babylon Lite Scene Properties")?.content[0];
        const sceneElement = sceneContent?.component({ context: scene });
        if (!isValidElement<{ scene: SceneContext }>(sceneElement) || typeof sceneElement.type !== "function") {
            throw new Error("Expected the scene property provider to render a function component.");
        }
        const sceneProperties = (sceneElement.type as FunctionComponent<{ scene: SceneContext }>)(sceneElement.props);
        expect("name" in scene).toBe(false);
        if (!isValidElement<{ children?: ReactNode }>(sceneProperties)) {
            throw new Error("Expected the scene properties component to render property lines.");
        }
        const sceneBoundProperties = Children.toArray(sceneProperties.props.children).filter(
            (child): child is ReactElement<{ propertyKey: string; target: object; defaultValue?: string; ignoreNullable?: boolean }> =>
                isValidElement(child) && child.type === BoundProperty
        );
        expect(sceneBoundProperties.map((property) => property.props.propertyKey)).toEqual(["name", "fixedDeltaMs"]);
        expect(sceneBoundProperties[0].props).toMatchObject({ target: scene, defaultValue: "", ignoreNullable: true });

        const textLayerContent = registrations.get("Babylon Lite Text Layer Properties")?.content[0];
        const textLayerElement = textLayerContent?.component({ context: textLayer });
        if (!isValidElement<{ layer: TextLayer }>(textLayerElement) || typeof textLayerElement.type !== "function") {
            throw new Error("Expected the text layer property provider to render a function component.");
        }
        const textLayerProperties = (textLayerElement.type as FunctionComponent<{ layer: TextLayer }>)(textLayerElement.props);
        if (!isValidElement<{ children?: ReactNode }>(textLayerProperties)) {
            throw new Error("Expected the text layer properties component to render property lines.");
        }
        const boundProperties = Children.toArray(textLayerProperties.props.children).filter(
            (child): child is ReactElement<{ propertyKey: string; target: object; propertyPath?: string }> => isValidElement(child) && child.type === BoundProperty
        );
        expect(boundProperties.map((property) => property.props.propertyKey)).toEqual(["visible", "x", "y", "rotationRad", "scale", "order", "opacity", "coverageGamma"]);
        expect(boundProperties[1].props).toMatchObject({ target: textLayer.positionPx, propertyPath: "positionPx.x" });
        expect(boundProperties[6].props).toMatchObject({ target: textLayer, min: 0, max: 1 });

        const unregisteredScene = { ...scene } as RenderingContext;
        const legacyUtilityLayer = { _kind: "utility-layer" } as RenderingContext;
        (engine._renderingContexts as RenderingContext[]).push(legacyUtilityLayer);
        expect(registrations.get("Babylon Lite Scene Properties")?.predicate(unregisteredScene)).toBe(false);
        expect(registrations.get("Babylon Lite Scene Properties")?.predicate(legacyUtilityLayer)).toBe(false);
        expect(registrations.get("Babylon Lite Material Properties")?.predicate({ name: "Not a material" })).toBe(false);
        expect(registrations.get("Babylon Lite Texture Properties")?.predicate({ width: 16, height: 8 })).toBe(false);
        expect(registrations.get("Babylon Lite Text Layer Properties")?.predicate({ ...textLayer })).toBe(false);

        services.forEach((service) => service?.dispose?.());
        expect(disposals).toHaveLength(8);
        disposals.forEach((dispose) => expect(dispose).toHaveBeenCalledOnce());
    });

    it("updates computed counts and dimensions in manual and polling watch modes", () => {
        vi.useFakeTimers();
        const sceneMeshes: Mesh[] = [];
        const scene = {
            _kind: "scene",
            meshes: sceneMeshes,
            lights: [],
            animationGroups: [],
            shadowGenerators: [],
            fixedDeltaMs: 0,
        } as unknown as SceneContext;
        const rendererLayers: TextLayer[] = [];
        const textRenderer = { _kind: "text-renderer", layers: rendererLayers } as unknown as TextRenderer;
        const textLayerRuns = [
            {
                glyphs: [{}, {}],
            },
        ];
        const textLayer = {
            data: { runs: textLayerRuns },
        } as unknown as TextLayer;
        const auxiliarySurface = {
            canvas: { width: 320, height: 200 },
            format: "bgra8unorm",
            msaaSamples: 4,
            maxDevicePixelRatio: 2,
            _renderingContexts: [textRenderer],
        } as unknown as SurfaceContext;
        const surfaces: SurfaceContext[] = [];
        const engine = {
            surfaces,
            canvas: { width: 640, height: 480 },
            format: "bgra8unorm",
            msaaSamples: 4,
            maxDevicePixelRatio: Infinity,
            drawCallCount: 3,
            gpuFrameTimeMs: 1.5,
            useHighPrecisionMatrix: false,
            useFloatingOrigin: false,
            _renderingContexts: [scene],
        } as unknown as EngineContext;
        surfaces.push(engine, auxiliarySurface);

        const registrations = new Map<string, RegisteredContent>();
        const propertiesService = {
            addSectionContent: vi.fn((content: RegisteredContent) => {
                registrations.set(content.key, content);
                return { dispose: () => {} };
            }),
        } as unknown as IPropertiesService;
        const engineContext = { engine } as IEngineContext;
        const services = [
            EnginePropertiesServiceDefinition.factory(propertiesService, engineContext),
            RenderingContextPropertiesServiceDefinition.factory(propertiesService, engineContext),
            TextLayerPropertiesServiceDefinition.factory(propertiesService, engineContext),
        ];
        const settingsStore = new TestSettingsStore();
        const watcherDefinitions = MakeWatcherServiceDefinitions({ defaultSettings: { mode: "manual" } });
        const watcher = watcherDefinitions.watcherServiceDefinition.factory(settingsStore, new TestReactContextService());
        const watcherSettingsDescriptor: SettingDescriptor<{ mode: "intercept" } | { mode: "polling"; interval: number } | { mode: "manual" }> = {
            key: "WatcherSettings",
            defaultValue: { mode: "manual" },
        };
        const content = [
            registrations.get("Babylon Lite Engine Properties")!.content[0].component({ context: engine }),
            registrations.get("Babylon Lite Surface Properties")!.content[0].component({ context: auxiliarySurface }),
            registrations.get("Babylon Lite Scene Properties")!.content[0].component({ context: scene }),
            registrations.get("Babylon Lite Text Renderer Properties")!.content[0].component({ context: textRenderer }),
            registrations.get("Babylon Lite Text Layer Properties")!.content[0].component({ context: textLayer }),
        ];
        const container = document.createElement("div");
        document.body.appendChild(container);
        const root = createRoot(container);

        act(() =>
            root.render(
                <FluentProvider theme={webLightTheme}>
                    <WatcherContext.Provider value={watcher}>
                        {content.map((item, index) => (
                            <div key={index}>{item}</div>
                        ))}
                    </WatcherContext.Provider>
                </FluentProvider>
            )
        );
        expect(GetNormalizedText(container)).toContain("SurfaceCount2");
        expect(GetNormalizedText(container)).toContain("CanvasWidth320px");
        expect(GetNormalizedText(container)).toContain("MeshCount0");
        expect(GetNormalizedText(container)).toContain("LayerCount0");
        expect(GetNormalizedText(container)).toContain("RunCount1");
        expect(GetNormalizedText(container)).toContain("GlyphCount2");

        surfaces.push({} as SurfaceContext);
        auxiliarySurface.canvas.width = 640;
        sceneMeshes.push({} as Mesh);
        rendererLayers.push({} as TextLayer);
        textLayerRuns[0].glyphs.push({});
        textLayerRuns.push({ glyphs: [{}, {}] });
        act(() => watcher.refresh());
        expect(GetNormalizedText(container)).toContain("SurfaceCount3");
        expect(GetNormalizedText(container)).toContain("CanvasWidth640px");
        expect(GetNormalizedText(container)).toContain("MeshCount1");
        expect(GetNormalizedText(container)).toContain("LayerCount1");
        expect(GetNormalizedText(container)).toContain("RunCount2");
        expect(GetNormalizedText(container)).toContain("GlyphCount5");

        act(() => settingsStore.writeSetting(watcherSettingsDescriptor, { mode: "polling", interval: 100 }));
        surfaces.push({} as SurfaceContext);
        auxiliarySurface.canvas.width = 800;
        sceneMeshes.push({} as Mesh);
        rendererLayers.push({} as TextLayer);
        textLayerRuns[1].glyphs.push({});
        textLayerRuns.push({ glyphs: [{}] });
        act(() => vi.advanceTimersByTime(99));
        expect(GetNormalizedText(container)).toContain("SurfaceCount3");
        expect(GetNormalizedText(container)).toContain("CanvasWidth640px");
        expect(GetNormalizedText(container)).toContain("MeshCount1");
        expect(GetNormalizedText(container)).toContain("LayerCount1");
        expect(GetNormalizedText(container)).toContain("RunCount2");
        expect(GetNormalizedText(container)).toContain("GlyphCount5");

        act(() => vi.advanceTimersByTime(1));
        expect(GetNormalizedText(container)).toContain("SurfaceCount4");
        expect(GetNormalizedText(container)).toContain("CanvasWidth800px");
        expect(GetNormalizedText(container)).toContain("MeshCount2");
        expect(GetNormalizedText(container)).toContain("LayerCount2");
        expect(GetNormalizedText(container)).toContain("RunCount3");
        expect(GetNormalizedText(container)).toContain("GlyphCount7");

        act(() => root.unmount());
        container.remove();
        watcher.dispose?.();
        services.forEach((service) => service?.dispose?.());
    });
});
