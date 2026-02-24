import type { IDisposable, IReadonlyObservable, Nullable, Scene } from "core/index";
import type { WeaklyTypedServiceDefinition } from "./modularity/serviceContainer";
import type { ServiceDefinition } from "./modularity/serviceDefinition";
import type { ModularToolOptions } from "./modularTool";
import type { ISceneContext } from "./services/sceneContext";
import type { IShellService } from "./services/shellService";

import { AsyncLock } from "core/Misc/asyncLock";
import { Logger } from "core/Misc/logger";
import { Observable } from "core/Misc/observable";
import { useEffect, useRef } from "react";
import { DefaultInspectorExtensionFeed } from "./extensibility/defaultInspectorExtensionFeed";
import { LegacyInspectableObjectPropertiesServiceDefinition } from "./legacy/inspectableCustomPropertiesService";
import { MakeModularTool } from "./modularTool";
import { GizmoServiceDefinition } from "./services/gizmoService";
import { GizmoToolbarServiceDefinition } from "./services/gizmoToolbarService";
import { HighlightServiceDefinition } from "./services/highlightService";
import { MiniStatsServiceDefinition } from "./services/miniStatsService";
import { DebugServiceDefinition } from "./services/panes/debugService";
import { AnimationGroupPropertiesServiceDefinition } from "./services/panes/properties/animationGroupPropertiesService";
import { AnimationPropertiesServiceDefinition } from "./services/panes/properties/animationPropertiesService";
import { AtmospherePropertiesServiceDefinition } from "./services/panes/properties/atmospherePropertiesService";
import { AudioPropertiesServiceDefinition } from "./services/panes/properties/audioPropertiesService";
import { CameraPropertiesServiceDefinition } from "./services/panes/properties/cameraPropertiesService";
import { CommonPropertiesServiceDefinition } from "./services/panes/properties/commonPropertiesService";
import { EffectLayerPropertiesServiceDefinition } from "./services/panes/properties/effectLayerPropertiesService";
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
import { DisposableCommandServiceDefinition } from "./services/panes/scene/disposableCommandService";
import { EffectLayerExplorerServiceDefinition } from "./services/panes/scene/effectLayersExplorerService";
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
import { SettingsServiceDefinition } from "./services/panes/settingsService";
import { StatsServiceDefinition } from "./services/panes/statsService";
import { CaptureToolsDefinition } from "./services/panes/tools/captureService";
import { ExportServiceDefinition } from "./services/panes/tools/exportService";
import { GLTFAnimationImportServiceDefinition } from "./services/panes/tools/import/gltfAnimationImportService";
import { GLTFLoaderOptionsServiceDefinition } from "./services/panes/tools/import/gltfLoaderOptionsService";
import { GLTFValidationServiceDefinition } from "./services/panes/tools/import/gltfValidationService";
import { ToolsServiceDefinition } from "./services/panes/toolsService";
import { PickingServiceDefinition } from "./services/pickingService";
import { SceneContextIdentity } from "./services/sceneContext";
import { SelectionServiceDefinition } from "./services/selectionService";
import { ShellServiceIdentity } from "./services/shellService";
import { ShellSettingsServiceDefinition } from "./services/shellSettingsService";
import { TextureEditorServiceDefinition } from "./services/textureEditor/textureEditorService";
import { UserFeedbackServiceDefinition } from "./services/userFeedbackService";
import { WatcherRefreshToolbarServiceDefinition, WatcherSettingsServiceDefinition } from "./services/watcherService";

type LayoutMode = "inline" | "overlay";

export type InspectorOptions = Omit<ModularToolOptions, "toolbarMode"> & {
    autoResizeEngine?: boolean;
    layoutMode?: LayoutMode;
};

export type InspectorToken = IDisposable & {
    readonly isDisposed: boolean;
    readonly onDisposed: IReadonlyObservable<void>;
};

// TODO: The key should probably be the Canvas, because we only want to show one inspector instance per canvas.
//       If it is called for a different scene that is rendering to the same canvas, then we should probably
//       switch the inspector instance to that scene (once this is supported).
const InspectorTokens = new WeakMap<Scene, IDisposable>();

// This async lock is used to sequentialize all calls to ShowInspector and dispose of existing inspectors.
// This is needed because each time Inspector is shown or hidden, it is potentially mutating the same DOM element.
const InspectorLock = new AsyncLock();

export function ShowInspector(scene: Scene, options: Partial<InspectorOptions> = {}): InspectorToken {
    // Dispose of any existing inspector for this scene.
    InspectorTokens.get(scene)?.dispose();

    // Default the dispose logic to a no-op until we know that we are actually going
    // to show the Inspector and there will be cleanup work to do.
    let disposeAsync = async () => await Promise.resolve();

    // Create an inspector dispose token. The dispose will use the same async lock to
    // make sure async dispose (hide) does not actually start until async show is finished.
    let isDisposed = false;
    const onDisposed = new Observable<void>();
    const inspectorToken = {
        dispose() {
            // eslint-disable-next-line @typescript-eslint/no-floating-promises
            InspectorLock.lockAsync(async () => {
                await disposeAsync();
                isDisposed = true;
                onDisposed.notifyObservers();
                onDisposed.clear();
            });
        },
        get isDisposed() {
            return isDisposed;
        },
        get onDisposed() {
            return onDisposed;
        },
    } as const satisfies InspectorToken;

    // Track the inspector token for the scene.
    InspectorTokens.set(scene, inspectorToken);

    // Set default options.
    options = {
        autoResizeEngine: true,
        layoutMode: "overlay",
        ...options,
    };

    // Sequentialize showing the inspector (e.g. don't start showing until after a previous hide (for example) is finished).
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    InspectorLock.lockAsync(async () => {
        let parentElement = options.containerElement ?? null;
        // If a container element was not found, find an appropriate one above the engine's rendering canvas.
        if (!parentElement) {
            const renderingCanvas = scene.getEngine().getRenderingCanvas();
            parentElement = renderingCanvas;
            while (parentElement) {
                const rootNode = parentElement.getRootNode();
                // TODO: Right now we never parent the inspector within a ShadowRoot because we need to do more work to get FluentProvider to work correctly in this context.
                if (rootNode instanceof ShadowRoot) {
                    // If we are in a ShadowRoot, continue up the tree.
                    parentElement = rootNode.host.parentElement;
                } else {
                    // Found the closest ancestor that is not in a ShadowRoot.
                    break;
                }
            }

            if (renderingCanvas && parentElement === renderingCanvas) {
                // If we were not in a ShadowRoot, then the direct parent of the rendering canvas is the container.
                parentElement = renderingCanvas.parentElement;
            }

            if (!parentElement) {
                // If we still haven't found a parent element, default to document.body.
                parentElement = document.body;
            }
        }

        // If we couldn't find a parent element, we can't show the inspector.
        if (!parentElement) {
            Logger.Warn("Unable to find a parent element to host the Inspector.");
            return;
        }

        // This will keep track of all the cleanup work we need to do when hiding the inspector.
        const disposeActions: (() => void | Promise<void>)[] = [];

        // Update the disposeAsync function to walk the dispose actions in reverse order
        // and call each one.
        let disposed = false;
        disposeAsync = async () => {
            if (disposed) {
                return;
            }
            disposed = true;

            for (const disposeAction of disposeActions.reverse()) {
                const result = disposeAction();
                if (result) {
                    // eslint-disable-next-line no-await-in-loop
                    await result;
                }
            }
        };

        // If we were responsible for resizing the engine, resize one more after the inspector UI is hidden.
        disposeActions.push(() => {
            if (options.autoResizeEngine) {
                scene.getEngine().resize();
            }
        });

        // This array will contain all the default Inspector service definitions.
        const serviceDefinitions: WeaklyTypedServiceDefinition[] = [];

        // Create a container element for the inspector UI.
        // This element will become the root React node, so it must be a new empty node
        // since React will completely take over its contents.
        const containerElement = document.createElement("div");
        containerElement.id = "babylon-inspector-container";
        containerElement.style.position = "absolute";
        containerElement.style.inset = "0";
        containerElement.style.display = "flex";
        // For "overlay" layout mode, we let pointer events pass through the inspector container.
        // Pointer events are re-enabled specifically for toolbars, side panes, and central content elements.
        containerElement.style.pointerEvents = "none";

        // When the layoutMode is "inline", we will re-parent the child nodes of the parentElement under the containerElement.
        if (options.layoutMode === "inline") {
            // Remove all the existing children from the parent element.
            const canvasContainerDisplay = parentElement.style.display;
            const canvasContainerChildren = [...parentElement.childNodes];
            parentElement.replaceChildren();

            disposeActions.push(() => {
                parentElement.replaceChildren(...canvasContainerChildren);
            });

            // This service is responsible for injecting the passed in canvas as the "central content" of the shell UI (the main area between the side panes and toolbars).
            const canvasInjectorServiceDefinition: ServiceDefinition<[], [IShellService]> = {
                friendlyName: "Canvas Injector",
                consumes: [ShellServiceIdentity],
                factory: (shellService) => {
                    const registration = shellService.addCentralContent({
                        key: "Canvas Injector",
                        component: () => {
                            const canvasContainerRef = useRef<HTMLDivElement>(null);
                            useEffect(() => {
                                canvasContainerRef.current?.replaceChildren(...canvasContainerChildren);
                            }, []);

                            return <div ref={canvasContainerRef} style={{ display: canvasContainerDisplay, position: "absolute", inset: "0" }} />;
                        },
                    });

                    return {
                        dispose: () => {
                            registration.dispose();
                        },
                    };
                },
            };

            serviceDefinitions.push(canvasInjectorServiceDefinition);
        }

        // Now it is safe to append the container element to the parent.
        parentElement.appendChild(containerElement);
        disposeActions.push(() => {
            parentElement.removeChild(containerElement);
        });

        // This service exposes the scene that was passed into Inspector through ISceneContext, which is used by other services that may be used in other contexts outside of Inspector.
        const sceneContextServiceDefinition: ServiceDefinition<[ISceneContext], []> = {
            friendlyName: "Inspector Scene Context",
            produces: [SceneContextIdentity],
            factory: () => {
                return {
                    currentScene: scene,
                    currentSceneObservable: new Observable<Nullable<Scene>>(),
                };
            },
        };
        serviceDefinitions.push(sceneContextServiceDefinition);

        if (options.autoResizeEngine) {
            const observer = scene.onBeforeRenderObservable.add(() => scene.getEngine().resize());
            disposeActions.push(() => observer.remove());
        }

        serviceDefinitions.push(
            // Helps with managing gizmos and a shared utility layer.
            GizmoServiceDefinition,

            // Scene explorer tab and related services.
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
            AtmosphereExplorerServiceDefinition,
            SoundExplorerServiceDefinition,
            DisposableCommandServiceDefinition,

            // Properties pane tab and related services.
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
            AnimationGroupPropertiesServiceDefinition,
            MetadataPropertiesServiceDefinition,
            AtmospherePropertiesServiceDefinition,
            AudioPropertiesServiceDefinition,

            // Texture editor and related services.
            TextureEditorServiceDefinition,

            // Debug pane tab and related services.
            DebugServiceDefinition,

            // Stats pane tab and related services.
            StatsServiceDefinition,

            // Tools pane tab and related services.
            ToolsServiceDefinition,
            ExportServiceDefinition,
            GLTFAnimationImportServiceDefinition,
            GLTFLoaderOptionsServiceDefinition,
            GLTFValidationServiceDefinition,
            CaptureToolsDefinition,

            // Settings pane tab and related services.
            SettingsServiceDefinition,
            WatcherSettingsServiceDefinition,
            ShellSettingsServiceDefinition,

            // Adds a button to refresh all properties manually (when watcher is in "manual" mode).
            WatcherRefreshToolbarServiceDefinition,

            // Tracks entity selection state (e.g. which Mesh or Material or other entity is currently selected in scene explorer and bound to the properties pane, etc.).
            SelectionServiceDefinition,

            // Gizmos for manipulating objects in the scene.
            GizmoToolbarServiceDefinition,

            // Allows picking objects from the scene to select them.
            PickingServiceDefinition,

            // Highlights the selected mesh in the scene.
            HighlightServiceDefinition,

            // Adds entry points for user feedback on Inspector v2 (probably eventually will be removed).
            UserFeedbackServiceDefinition,

            // Adds always present "mini stats" (like fps) to the toolbar, etc.
            MiniStatsServiceDefinition,

            // Legacy service to support custom inspectable properties on objects.
            LegacyInspectableObjectPropertiesServiceDefinition
        );

        const modularTool = MakeModularTool({
            namespace: "Inspector",
            containerElement,
            serviceDefinitions: [
                // Default Inspector services.
                ...serviceDefinitions,

                // Additional services passed in to the Inspector.
                ...(options.serviceDefinitions ?? []),
            ],
            themeMode: options.themeMode,
            showThemeSelector: options.showThemeSelector,
            extensionFeeds: [DefaultInspectorExtensionFeed, ...(options.extensionFeeds ?? [])],
            toolbarMode: "compact",
            sidePaneRemapper: options.sidePaneRemapper,
            leftPaneDefaultCollapsed: options.leftPaneDefaultCollapsed,
            rightPaneDefaultCollapsed: options.rightPaneDefaultCollapsed,
        });
        disposeActions.push(() => modularTool.dispose());

        const sceneDisposedObserver = scene.onDisposeObservable.addOnce(() => {
            inspectorToken.dispose();
        });

        disposeActions.push(() => sceneDisposedObserver.remove());

        disposeActions.push(() => {
            InspectorTokens.delete(scene);
        });
    });

    return inspectorToken;
}
