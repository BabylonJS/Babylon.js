import { type Scene } from "core/index";
import { type WeaklyTypedServiceDefinition } from "shared-ui-components/modularTool/modularity/serviceContainer";
import { SettingsServiceDefinition } from "shared-ui-components/modularTool/services/settingsService";
import { ShellSettingsServiceDefinition } from "shared-ui-components/modularTool/services/shellSettingsService";

import { DefaultInspectorExtensionFeed } from "./extensibility/defaultInspectorExtensionFeed";
import { _StartInspectable } from "./inspectable";
import { type InspectorOptions, type InspectorToken } from "./inspector.common";
import { _ShowInspector } from "./inspectorHost";
import { LegacyInspectableObjectPropertiesServiceDefinition } from "./legacy/inspectableCustomPropertiesService";
import { CliConnectionStatusServiceDefinition } from "./services/cliConnectionStatusService";
import { GizmoServiceDefinition } from "./services/gizmoService";
import { GizmoToolbarServiceDefinition } from "./services/gizmoToolbarService";
import { HighlightServiceDefinition } from "./services/highlightService";
import { InspectorSettingsServiceDefinition } from "./services/inspectorSettingsService";
import { MiniStatsServiceDefinition } from "./services/miniStatsService";
import { OverrideCaptureServiceDefinition } from "./services/overrideCaptureService";
import { BabylonProjectAuthoringServiceDefinition } from "./services/panes/babylonProjectAuthoringService";
import { DebugServiceDefinition } from "./services/panes/debugService";
import { AnimationGroupPropertiesServiceDefinition } from "./services/panes/properties/animationGroupPropertiesService";
import { AnimationPropertiesServiceDefinition } from "./services/panes/properties/animationPropertiesService";
import { AtmospherePropertiesServiceDefinition } from "./services/panes/properties/atmospherePropertiesService";
import { AudioPropertiesServiceDefinition } from "./services/panes/properties/audioPropertiesService";
import { CameraPropertiesServiceDefinition } from "./services/panes/properties/cameraPropertiesService";
import { CommonPropertiesServiceDefinition } from "./services/panes/properties/commonPropertiesService";
import { EffectLayerPropertiesServiceDefinition } from "./services/panes/properties/effectLayerPropertiesService";
import { FlowGraphPropertiesServiceDefinition } from "./services/panes/properties/flowGraphPropertiesService";
import { FrameGraphPropertiesServiceDefinition } from "./services/panes/properties/frameGraphPropertiesService";
import { LightPropertiesServiceDefinition } from "./services/panes/properties/lightPropertiesServices";
import { MaterialPropertiesServiceDefinition } from "./services/panes/properties/materialPropertiesService";
import { MetadataPropertiesServiceDefinition } from "./services/panes/properties/metadataPropertiesService";
import { NodePropertiesServiceDefinition } from "./services/panes/properties/nodePropertiesService";
import { ParticleSystemPropertiesServiceDefinition } from "./services/panes/properties/particleSystemPropertiesService";
import { PhysicsPropertiesServiceDefinition } from "./services/panes/properties/physicsPropertiesService";
import { PostProcessPropertiesServiceDefinition } from "./services/panes/properties/postProcessPropertiesService";
import { PropertiesServiceDefinition } from "./services/panes/properties/propertiesService";
import { RenderingPipelinePropertiesServiceDefinition } from "./services/panes/properties/renderingPipelinePropertiesService";
import { ScenePropertiesServiceDefinition } from "./services/panes/properties/scenePropertiesService";
import { SkeletonPropertiesServiceDefinition } from "./services/panes/properties/skeletonPropertiesService";
import { SpritePropertiesServiceDefinition } from "./services/panes/properties/spritePropertiesService";
import { TexturePropertiesServiceDefinition } from "./services/panes/properties/texturePropertiesService";
import { TransformPropertiesServiceDefinition } from "./services/panes/properties/transformPropertiesService";
import { AnimationGroupExplorerServiceDefinition } from "./services/panes/scene/animationGroupExplorerService";
import { AtmosphereExplorerServiceDefinition } from "./services/panes/scene/atmosphereExplorerService";
import { AudioV2ExplorerServiceDefinition } from "./services/panes/scene/audioV2ExplorerService";
import { DisposableCommandServiceDefinition } from "./services/panes/scene/disposableCommandService";
import { EffectLayerExplorerServiceDefinition } from "./services/panes/scene/effectLayersExplorerService";
import { FlowGraphExplorerServiceDefinition } from "./services/panes/scene/flowGraphExplorerService";
import { FrameGraphExplorerServiceDefinition } from "./services/panes/scene/frameGraphExplorerService";
import { GuiExplorerServiceDefinition } from "./services/panes/scene/guiExplorerService";
import { MaterialExplorerServiceDefinition } from "./services/panes/scene/materialExplorerService";
import { NodeExplorerServiceDefinition } from "./services/panes/scene/nodeExplorerService";
import { ParticleSystemExplorerServiceDefinition } from "./services/panes/scene/particleSystemExplorerService";
import { PostProcessExplorerServiceDefinition } from "./services/panes/scene/postProcessExplorerService";
import { RenderingPipelineExplorerServiceDefinition } from "./services/panes/scene/renderingPipelinesExplorerService";
import { SceneExplorerServiceDefinition } from "./services/panes/scene/sceneExplorerService";
import { SkeletonExplorerServiceDefinition } from "./services/panes/scene/skeletonExplorerService";
import { SoundExplorerServiceDefinition } from "./services/panes/scene/soundExplorerService";
import { SpriteManagerExplorerServiceDefinition } from "./services/panes/scene/spriteManagerExplorerService";
import { TextureExplorerServiceDefinition } from "./services/panes/scene/texturesExplorerService";
import { StatsServiceDefinition } from "./services/panes/statsService";
import { CaptureToolsDefinition } from "./services/panes/tools/captureService";
import { ExportServiceDefinition } from "./services/panes/tools/exportService";
import { GLTFAnimationImportServiceDefinition } from "./services/panes/tools/import/gltfAnimationImportService";
import { GLTFLoaderOptionsServiceDefinition } from "./services/panes/tools/import/gltfLoaderOptionsService";
import { GLTFValidationServiceDefinition } from "./services/panes/tools/import/gltfValidationService";
import { ToolsServiceDefinition } from "./services/panes/toolsService";
import { PickingServiceDefinition } from "./services/pickingService";
import { SceneSelectionServiceDefinition } from "./services/sceneSelectionService";
import { SelectionServiceDefinition } from "./services/selectionService";
import { SmartAssetPromptServiceDefinition } from "./services/smartAssetPromptService";
import { TextureEditorServiceDefinition } from "./services/textureEditor/textureEditorService";
import { UserFeedbackServiceDefinition } from "./services/userFeedbackService";
import { MakeWatcherServiceDefinitions } from "./services/watcherService";

export type { InspectorOptions, InspectorToken } from "./inspector.common";

/**
 * Shows the inspector for the specified scene.
 * @param scene The scene to inspect.
 * @param options Optional configuration for the inspector.
 * @returns An {@link InspectorToken} that can be disposed to hide the inspector.
 */
export function ShowInspector(scene: Scene, options: Partial<InspectorOptions> = {}): InspectorToken {
    const engine = scene.getEngine();

    return _ShowInspector(scene, options, {
        renderingCanvas: engine.getRenderingCanvas(),
        resize: () => engine.resize(),
        startAutoResize: () => {
            const observer = scene.onBeforeRenderObservable.add(() => engine.resize());
            return () => observer.remove();
        },
        initialize: (resolvedOptions) => {
            const inspectableToken = _StartInspectable(scene, { autoEnable: false });
            const { watcherServiceDefinition, watcherSettingsServiceDefinition, watcherRefreshToolbarServiceDefinition } = MakeWatcherServiceDefinitions();
            const serviceDefinitions: WeaklyTypedServiceDefinition[] = [
                watcherServiceDefinition,
                GizmoServiceDefinition,
                SceneExplorerServiceDefinition,
                NodeExplorerServiceDefinition,
                SkeletonExplorerServiceDefinition,
                MaterialExplorerServiceDefinition,
                TextureExplorerServiceDefinition,
                PostProcessExplorerServiceDefinition,
                RenderingPipelineExplorerServiceDefinition,
                EffectLayerExplorerServiceDefinition,
                ParticleSystemExplorerServiceDefinition,
                SpriteManagerExplorerServiceDefinition,
                AnimationGroupExplorerServiceDefinition,
                GuiExplorerServiceDefinition,
                FrameGraphExplorerServiceDefinition,
                FlowGraphExplorerServiceDefinition,
                AtmosphereExplorerServiceDefinition,
                SoundExplorerServiceDefinition,
                AudioV2ExplorerServiceDefinition,
                DisposableCommandServiceDefinition,
                ScenePropertiesServiceDefinition,
                PropertiesServiceDefinition,
                TexturePropertiesServiceDefinition,
                CommonPropertiesServiceDefinition,
                TransformPropertiesServiceDefinition,
                AnimationPropertiesServiceDefinition,
                NodePropertiesServiceDefinition,
                PhysicsPropertiesServiceDefinition,
                SkeletonPropertiesServiceDefinition,
                MaterialPropertiesServiceDefinition,
                LightPropertiesServiceDefinition,
                SpritePropertiesServiceDefinition,
                ParticleSystemPropertiesServiceDefinition,
                CameraPropertiesServiceDefinition,
                PostProcessPropertiesServiceDefinition,
                RenderingPipelinePropertiesServiceDefinition,
                EffectLayerPropertiesServiceDefinition,
                FrameGraphPropertiesServiceDefinition,
                FlowGraphPropertiesServiceDefinition,
                AnimationGroupPropertiesServiceDefinition,
                MetadataPropertiesServiceDefinition,
                AtmospherePropertiesServiceDefinition,
                AudioPropertiesServiceDefinition,
                TextureEditorServiceDefinition,
                DebugServiceDefinition,
                StatsServiceDefinition,
                ToolsServiceDefinition,
                ExportServiceDefinition,
                SmartAssetPromptServiceDefinition,
                BabylonProjectAuthoringServiceDefinition,
                OverrideCaptureServiceDefinition,
                GLTFAnimationImportServiceDefinition,
                GLTFLoaderOptionsServiceDefinition,
                GLTFValidationServiceDefinition,
                CaptureToolsDefinition,
                SettingsServiceDefinition,
                InspectorSettingsServiceDefinition,
                watcherSettingsServiceDefinition,
                ShellSettingsServiceDefinition,
                watcherRefreshToolbarServiceDefinition,
                SelectionServiceDefinition,
                SceneSelectionServiceDefinition,
                GizmoToolbarServiceDefinition,
                PickingServiceDefinition,
                HighlightServiceDefinition,
                UserFeedbackServiceDefinition,
                CliConnectionStatusServiceDefinition,
                MiniStatsServiceDefinition,
                LegacyInspectableObjectPropertiesServiceDefinition,
            ];

            return {
                parentContainer: inspectableToken.serviceContainer,
                serviceDefinitions,
                extensionFeeds: [DefaultInspectorExtensionFeed, ...(resolvedOptions.extensionFeeds ?? [])],
                dispose: () => inspectableToken.dispose(),
            };
        },
        registerTargetDisposed: (disposeInspector) => {
            // This observer must run before StartInspectable's scene-dispose callback so the child UI is torn down first.
            const observer = scene.onDisposeObservable.add(disposeInspector, undefined, true, undefined, true);
            return () => observer.remove();
        },
    });
}
