import type { IDisposable, Scene } from "core/scene";
import type { Nullable } from "core/types";
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
import { MiniStatsServiceDefinition } from "./services/miniStatsService";
import { DebugServiceDefinition } from "./services/panes/debugService";
import { AnimationGroupPropertiesServiceDefinition } from "./services/panes/properties/animationGroupPropertiesService";
import { AnimationPropertiesServiceDefinition } from "./services/panes/properties/animationPropertiesService";
import { AtmospherePropertiesServiceDefinition } from "./services/panes/properties/atmospherePropertiesService";
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
import { SpriteManagerExplorerServiceDefinition } from "./services/panes/scene/spriteManagerExplorerService";
import { TextureExplorerServiceDefinition } from "./services/panes/scene/texturesExplorerService";
import { SettingsServiceDefinition } from "./services/panes/settingsService";
import { StatsServiceDefinition } from "./services/panes/statsService";
import { ToolsServiceDefinition } from "./services/panes/toolsService";
import { PickingServiceDefinition } from "./services/pickingService";
import { SceneContextIdentity } from "./services/sceneContext";
import { SelectionServiceDefinition } from "./services/selectionService";
import { ShellServiceIdentity } from "./services/shellService";
import { UserFeedbackServiceDefinition } from "./services/userFeedbackService";
import { TextureEditorServiceDefinition } from "./services/textureEditor/textureEditorService";

export type InspectorOptions = Omit<ModularToolOptions, "toolbarMode"> & { autoResizeEngine?: boolean };

// TODO: The key should probably be the Canvas, because we only want to show one inspector instance per canvas.
//       If it is called for a different scene that is rendering to the same canvas, then we should probably
//       switch the inspector instance to that scene (once this is supported).
const InspectorTokens = new WeakMap<Scene, IDisposable>();

// This async lock is used to sequentialize all calls to ShowInspector and dispose of existing inspectors.
// This is needed because each time Inspector is shown or hidden, it is potentially mutating the same DOM element.
const InspectorLock = new AsyncLock();

export function ShowInspector(scene: Scene, options: Partial<InspectorOptions> = {}): IDisposable {
    // Dispose of any existing inspector for this scene.
    InspectorTokens.get(scene)?.dispose();

    // Default the dispose logic to a no-op until we know that we are actually going
    // to show the Inspector and there will be cleanup work to do.
    let disposeAsync = async () => await Promise.resolve();

    // Create an inspector dispose token. The dispose will use the same async lock to
    // make sure async dispose (hide) does not actually start until async show is finished.
    const inspectorToken = {
        dispose: () => {
            // eslint-disable-next-line @typescript-eslint/no-floating-promises
            InspectorLock.lockAsync(async () => {
                await disposeAsync();
            });
        },
    } as const;

    // Track the inspector token for the scene.
    InspectorTokens.set(scene, inspectorToken);

    // Set default options.
    options = {
        autoResizeEngine: true,
        ...options,
    };

    // Sequentialize showing the inspector (e.g. don't start showing until after a previous hide (for example) is finished).
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    InspectorLock.lockAsync(async () => {
        let parentElement = options.containerElement ?? null;
        // If a container element was not found, find an appropriate one above the engine's rendering canvas.
        if (!parentElement) {
            parentElement = scene.getEngine().getRenderingCanvas()?.parentElement ?? null;
            while (parentElement) {
                const rootNode = parentElement.getRootNode();
                // TODO: Right now we never parent the inspector within a ShadowRoot because we need to do more work to get FluentProvider to work correctly in this context.
                if (!(rootNode instanceof ShadowRoot)) {
                    break;
                }
                parentElement = rootNode.host.parentElement;
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

        // Remove all the existing children from the parent element.
        const canvasContainerDisplay = parentElement.style.display;
        const canvasContainerChildren = [...parentElement.childNodes];
        parentElement.replaceChildren();

        disposeActions.push(async () => {
            // When the ModularTool token is disposed, it unmounts the react element, which asynchronously
            // removes all children from the parentElement. We need to wait for that to complete before
            // re-adding the canvas children back to the parentElement.
            await new Promise((resolve) => setTimeout(resolve));
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

                        return <div ref={canvasContainerRef} style={{ display: canvasContainerDisplay, width: "100%", height: "100%" }} />;
                    },
                });

                return {
                    dispose: () => {
                        registration.dispose();
                    },
                };
            },
        };

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

        if (options.autoResizeEngine) {
            const observer = scene.onBeforeRenderObservable.add(() => scene.getEngine().resize());
            disposeActions.push(() => observer.remove());
        }

        const modularTool = MakeModularTool({
            containerElement: parentElement,
            serviceDefinitions: [
                // Injects the canvas the scene is rendering to into the central "content" area of the shell UI.
                canvasInjectorServiceDefinition,

                // Provides access to the scene in a generic way (other tools might provide a scene in a different way).
                sceneContextServiceDefinition,

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

                // Texture editor and related services.
                TextureEditorServiceDefinition,

                // Debug pane tab and related services.
                DebugServiceDefinition,

                // Stats pane tab and related services.
                StatsServiceDefinition,

                // Tools pane tab and related services.
                ToolsServiceDefinition,

                // Settings pane tab and related services.
                SettingsServiceDefinition,

                // Tracks entity selection state (e.g. which Mesh or Material or other entity is currently selected in scene explorer and bound to the properties pane, etc.).
                SelectionServiceDefinition,

                // Gizmos for manipulating objects in the scene.
                GizmoToolbarServiceDefinition,

                // Allows picking objects from the scene to select them.
                PickingServiceDefinition,

                // Adds entry points for user feedback on Inspector v2 (probably eventually will be removed).
                UserFeedbackServiceDefinition,

                // Adds always present "mini stats" (like fps) to the toolbar, etc.
                MiniStatsServiceDefinition,

                // Legacy service to support custom inspectable properties on objects.
                LegacyInspectableObjectPropertiesServiceDefinition,

                // Additional services passed in to the Inspector.
                ...(options.serviceDefinitions ?? []),
            ],
            themeMode: options.themeMode,
            showThemeSelector: options.showThemeSelector,
            extensionFeeds: [DefaultInspectorExtensionFeed, ...(options.extensionFeeds ?? [])],
            layoutMode: options.layoutMode,
            toolbarMode: "compact",
            sidePaneRemapper: options.sidePaneRemapper,
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
