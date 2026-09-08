import {
    type EngineContext,
    type Material,
    type RenderingContext,
    type SceneContext,
    type SpriteRenderer,
    type SurfaceContext,
    type TextLayer,
    type TextRenderer,
    type Texture2D,
} from "@babylonjs/lite";
import { Children, isValidElement, type FunctionComponent, type ReactElement, type ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

vi.hoisted(() => {
    vi.stubGlobal(
        "matchMedia",
        vi.fn(() => ({ matches: false }))
    );
});

import { EngineContextIdentity, type IEngineContext } from "../../src/lite/engineContext";
import { BoundProperty } from "../../src/components/properties/boundProperty";
import { EnginePropertiesServiceDefinition } from "../../src/lite/services/panes/properties/enginePropertiesService";
import { MaterialPropertiesServiceDefinition } from "../../src/lite/services/panes/properties/materialPropertiesService";
import { RenderingContextPropertiesServiceDefinition } from "../../src/lite/services/panes/properties/renderingContextPropertiesService";
import { TextLayerPropertiesServiceDefinition } from "../../src/lite/services/panes/properties/textLayerPropertiesService";
import { TexturePropertiesServiceDefinition } from "../../src/lite/services/panes/properties/texturePropertiesService";
import { type IPropertiesService, PropertiesServiceIdentity } from "../../src/services/panes/properties/propertiesService";

type RegisteredContent = Parameters<IPropertiesService["addSectionContent"]>[0];

describe("Babylon Lite properties services", () => {
    it("registers applicable content for every non-mesh Explorer entity", () => {
        const scene = {
            _kind: "scene",
            meshes: [],
            lights: [],
            animationGroups: [],
            shadowGenerators: [],
            fixedDeltaMs: 0,
        } as unknown as SceneContext;
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
        expect("name" in scene).toBe(true);
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
});
