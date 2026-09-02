import {
    type EngineContext,
    type Material,
    type RenderingContext,
    type SceneContext,
    type SpriteRenderer,
    type SurfaceContext,
    type TextRenderer,
    type Texture2D,
} from "@babylonjs/lite";
import { describe, expect, it, vi } from "vitest";

vi.hoisted(() => {
    vi.stubGlobal(
        "matchMedia",
        vi.fn(() => ({ matches: false }))
    );
});

import { EngineContextIdentity, type IEngineContext } from "../../src/lite/engineContext";
import { EnginePropertiesServiceDefinition } from "../../src/lite/services/panes/properties/enginePropertiesService";
import { MaterialPropertiesServiceDefinition } from "../../src/lite/services/panes/properties/materialPropertiesService";
import { RenderingContextPropertiesServiceDefinition } from "../../src/lite/services/panes/properties/renderingContextPropertiesService";
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
        const textRenderer = { _kind: "text-renderer", layers: [] } as unknown as TextRenderer;
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
        ];

        expect(EnginePropertiesServiceDefinition.consumes).toEqual([PropertiesServiceIdentity, EngineContextIdentity]);
        expect(RenderingContextPropertiesServiceDefinition.consumes).toEqual([PropertiesServiceIdentity, EngineContextIdentity]);
        expect(MaterialPropertiesServiceDefinition.consumes).toEqual([PropertiesServiceIdentity]);
        expect(TexturePropertiesServiceDefinition.consumes).toEqual([PropertiesServiceIdentity]);
        expect(registrations.size).toBe(7);

        expect(registrations.get("Babylon Lite Engine Properties")?.predicate(engine)).toBe(true);
        expect(registrations.get("Babylon Lite Engine Properties")?.predicate(auxiliarySurface)).toBe(false);
        expect(registrations.get("Babylon Lite Surface Properties")?.predicate(auxiliarySurface)).toBe(true);
        expect(registrations.get("Babylon Lite Surface Properties")?.predicate(engine)).toBe(false);
        expect(registrations.get("Babylon Lite Scene Properties")?.predicate(scene)).toBe(true);
        expect(registrations.get("Babylon Lite Text Renderer Properties")?.predicate(textRenderer)).toBe(true);
        expect(registrations.get("Babylon Lite Sprite Renderer Properties")?.predicate(spriteRenderer)).toBe(true);
        expect(registrations.get("Babylon Lite Material Properties")?.predicate(material)).toBe(true);
        expect(registrations.get("Babylon Lite Texture Properties")?.predicate(texture)).toBe(true);

        const unregisteredScene = { ...scene } as RenderingContext;
        expect(registrations.get("Babylon Lite Scene Properties")?.predicate(unregisteredScene)).toBe(false);
        expect(registrations.get("Babylon Lite Material Properties")?.predicate({ name: "Not a material" })).toBe(false);
        expect(registrations.get("Babylon Lite Texture Properties")?.predicate({ width: 16, height: 8 })).toBe(false);

        services.forEach((service) => service?.dispose?.());
        expect(disposals).toHaveLength(7);
        disposals.forEach((dispose) => expect(dispose).toHaveBeenCalledOnce());
    });
});
