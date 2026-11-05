import { type AudioEngine, type EngineContext, resizeEngine } from "@babylonjs/lite";
import { type WeaklyTypedServiceDefinition } from "shared-ui-components/modularTool/modularity/serviceContainer";
import { type ServiceDefinition } from "shared-ui-components/modularTool/modularity/serviceDefinition";
import { SettingsServiceDefinition } from "shared-ui-components/modularTool/services/settingsService";
import { ShellSettingsServiceDefinition } from "shared-ui-components/modularTool/services/shellSettingsService";

import { type InspectorOptions, type InspectorToken } from "../inspector.common";
import { _ShowInspector } from "../inspectorHost";
import { PropertiesServiceDefinition } from "../services/panes/properties/propertiesService";
import { SelectionServiceDefinition } from "../services/selectionService";
import { MakeWatcherServiceDefinitions } from "../services/watcherService";
import { type IEngineContext, EngineContextIdentity } from "./engineContext";
import { CreateAudioEngineContext, type IAudioEngineContext } from "./audioEngineContext";
import { AudioEngineExplorerServiceDefinition } from "./audioEngineExplorerService";
import { EngineExplorerServiceDefinition } from "./engineExplorerService";
import { EngineSelectionServiceDefinition } from "./engineSelectionService";
import { PickingServiceDefinition } from "./services/pickingService";
import { GizmoServiceDefinition } from "./services/gizmoService";
import { StatsServiceDefinition } from "./services/panes/statsService";
import { CaptureServiceDefinition } from "./services/panes/captureService";
import { DebugServiceDefinition } from "./services/panes/debugService";
import { EnginePropertiesServiceDefinition } from "./services/panes/properties/enginePropertiesService";
import { AnimationPropertiesServiceDefinition } from "./services/panes/properties/animationPropertiesService";
import { SkeletonPropertiesServiceDefinition } from "./services/panes/properties/skeletonPropertiesService";
import { ParticleSystemPropertiesServiceDefinition } from "./services/panes/properties/particleSystemPropertiesService";
import { FrameGraphPropertiesServiceDefinition } from "./services/panes/properties/frameGraphPropertiesService";
import { CameraPropertiesServiceDefinition } from "./services/panes/properties/cameraPropertiesService";
import { LightPropertiesServiceDefinition } from "./services/panes/properties/lightPropertiesService";
import { MaterialPropertiesServiceDefinition } from "./services/panes/properties/materialPropertiesService";
import { MeshPropertiesServiceDefinition } from "./services/panes/properties/meshPropertiesService";
import { RenderingContextPropertiesServiceDefinition } from "./services/panes/properties/renderingContextPropertiesService";
import { SceneNodePropertiesServiceDefinition } from "./services/panes/properties/sceneNodePropertiesService";
import { ShadowGeneratorPropertiesServiceDefinition } from "./services/panes/properties/shadowGeneratorPropertiesService";
import { SpriteLayerPropertiesServiceDefinition } from "./services/panes/properties/spriteLayerPropertiesService";
import { TextLayerPropertiesServiceDefinition } from "./services/panes/properties/textLayerPropertiesService";
import { TexturePropertiesServiceDefinition } from "./services/panes/properties/texturePropertiesService";
import { LiteAudioPropertiesServiceDefinition } from "./services/panes/properties/audioPropertiesService";
import { CameraExplorerServiceDefinition } from "./services/panes/scene/cameraExplorerService";
import { AnimationGroupExplorerServiceDefinition } from "./services/panes/scene/animationGroupExplorerService";
import { SkeletonExplorerServiceDefinition } from "./services/panes/scene/skeletonExplorerService";
import { ParticleSystemExplorerServiceDefinition } from "./services/panes/scene/particleSystemExplorerService";
import { FlowGraphExplorerServiceDefinition } from "./services/panes/scene/flowGraphExplorerService";
import { FrameGraphExplorerServiceDefinition } from "./services/panes/scene/frameGraphExplorerService";
import { LightExplorerServiceDefinition } from "./services/panes/scene/lightExplorerService";
import { MaterialExplorerServiceDefinition } from "./services/panes/scene/materialExplorerService";
import { MeshExplorerServiceDefinition } from "./services/panes/scene/meshExplorerService";
import { SceneResourceIndexServiceDefinition } from "./services/panes/scene/sceneResourceIndexService";
import { ShadowGeneratorExplorerServiceDefinition } from "./services/panes/scene/shadowGeneratorExplorerService";
import { SpriteLayerExplorerServiceDefinition } from "./services/panes/scene/spriteLayerExplorerService";
import { TextLayerExplorerServiceDefinition } from "./services/panes/scene/textLayerExplorerService";
import { TextureExplorerServiceDefinition } from "./services/panes/scene/textureExplorerService";
import { PhysicsExplorerServiceDefinition } from "./services/panes/scene/physicsExplorerService";
import { PhysicsPropertiesServiceDefinition } from "./services/panes/properties/physicsPropertiesService";

/**
 * A token returned by the Babylon Lite `ShowInspector` function.
 */
export type LiteInspectorToken = InspectorToken & {
    /**
     * Attaches, replaces, or detaches the audio engine shown in Inspector's Explorer.
     * Inspector does not take ownership of the audio engine or dispose it.
     * Calls made after the Inspector has been disposed are ignored.
     * @param audioEngine The audio engine to inspect, or `null` to remove the current audio engine.
     */
    setAudioEngine(audioEngine: AudioEngine | null): void;
};

/**
 * Shows Inspector for a Babylon Lite engine.
 * @param engine The Babylon Lite engine to inspect.
 * @param options Optional configuration for Inspector.
 * @returns A token that can attach an optional audio engine and dispose the Inspector.
 */
export function ShowInspector(engine: EngineContext, options: Partial<InspectorOptions> = {}): LiteInspectorToken {
    const renderingCanvas = engine.canvas instanceof HTMLCanvasElement ? engine.canvas : null;
    const audioEngineContext = CreateAudioEngineContext();

    const inspectorToken = _ShowInspector(engine, options, {
        renderingCanvas,
        resize: () => resizeEngine(engine),
        startAutoResize: renderingCanvas
            ? () => {
                  const resizeObserver = new ResizeObserver(() => resizeEngine(engine));
                  resizeObserver.observe(renderingCanvas);
                  return () => resizeObserver.disconnect();
              }
            : undefined,
        initialize: (resolvedOptions) => {
            const { watcherServiceDefinition, watcherSettingsServiceDefinition, watcherRefreshToolbarServiceDefinition } = MakeWatcherServiceDefinitions({
                defaultSettings: {
                    mode: "polling",
                    interval: 250,
                },
                supportedModes: ["polling", "manual"],
            });
            const engineContextServiceDefinition: ServiceDefinition<[IEngineContext], []> = {
                friendlyName: "Babylon Lite Engine Context",
                produces: [EngineContextIdentity],
                factory: () => ({
                    engine,
                }),
            };
            const audioEngineContextServiceDefinition: ServiceDefinition<[IAudioEngineContext], []> = audioEngineContext.serviceDefinition;

            const serviceDefinitions: WeaklyTypedServiceDefinition[] = [
                engineContextServiceDefinition,
                audioEngineContextServiceDefinition,
                watcherServiceDefinition,
                EngineExplorerServiceDefinition,
                AudioEngineExplorerServiceDefinition,
                SceneResourceIndexServiceDefinition,
                MeshExplorerServiceDefinition,
                CameraExplorerServiceDefinition,
                LightExplorerServiceDefinition,
                ShadowGeneratorExplorerServiceDefinition,
                MaterialExplorerServiceDefinition,
                TextureExplorerServiceDefinition,
                TextLayerExplorerServiceDefinition,
                SpriteLayerExplorerServiceDefinition,
                AnimationGroupExplorerServiceDefinition,
                SkeletonExplorerServiceDefinition,
                ParticleSystemExplorerServiceDefinition,
                PhysicsExplorerServiceDefinition,
                FrameGraphExplorerServiceDefinition,
                FlowGraphExplorerServiceDefinition,
                PropertiesServiceDefinition,
                EnginePropertiesServiceDefinition,
                RenderingContextPropertiesServiceDefinition,
                SceneNodePropertiesServiceDefinition,
                MeshPropertiesServiceDefinition,
                CameraPropertiesServiceDefinition,
                LightPropertiesServiceDefinition,
                ShadowGeneratorPropertiesServiceDefinition,
                MaterialPropertiesServiceDefinition,
                TexturePropertiesServiceDefinition,
                LiteAudioPropertiesServiceDefinition,
                TextLayerPropertiesServiceDefinition,
                SpriteLayerPropertiesServiceDefinition,
                AnimationPropertiesServiceDefinition,
                SkeletonPropertiesServiceDefinition,
                ParticleSystemPropertiesServiceDefinition,
                PhysicsPropertiesServiceDefinition,
                FrameGraphPropertiesServiceDefinition,
                SettingsServiceDefinition,
                watcherSettingsServiceDefinition,
                ShellSettingsServiceDefinition,
                watcherRefreshToolbarServiceDefinition,
                SelectionServiceDefinition,
                EngineSelectionServiceDefinition,
                PickingServiceDefinition,
                GizmoServiceDefinition,
                StatsServiceDefinition,
                CaptureServiceDefinition,
                DebugServiceDefinition,
            ];

            return {
                serviceDefinitions,
                extensionFeeds: resolvedOptions.extensionFeeds,
            };
        },
    });

    inspectorToken.onDisposed.add(() => audioEngineContext.context.dispose());

    const disposeAsync = async (): Promise<void> => {
        await inspectorToken.dispose();
    };

    return {
        dispose: disposeAsync,
        get isDisposed() {
            return inspectorToken.isDisposed;
        },
        get onDisposed() {
            return inspectorToken.onDisposed;
        },
        setAudioEngine: (audioEngine) => {
            if (!inspectorToken.isDisposed) {
                audioEngineContext.setAudioEngine(audioEngine);
            }
        },
    };
}
