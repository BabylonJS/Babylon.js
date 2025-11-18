import type { IDisposable, Scene } from "core/scene";
import type { Nullable } from "core/types";
import type { ServiceDefinition } from "./modularity/serviceDefinition";
import type { ModularToolOptions } from "./modularTool";
import type { ISceneContext } from "./services/sceneContext";
import type { IShellService } from "./services/shellService";

import { makeStyles } from "@fluentui/react-components";
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

export type InspectorOptions = Omit<ModularToolOptions, "toolbarMode"> & { autoResizeEngine?: boolean };

// TODO: The key should probably be the Canvas, because we only want to show one inspector instance per canvas.
//       If it is called for a different scene that is rendering to the same canvas, then we should probably
//       switch the inspector instance to that scene (once this is supported).
const InspectorTokens = new WeakMap<Scene, IDisposable>();

export function ShowInspector(scene: Scene, options: Partial<InspectorOptions> = {}): IDisposable {
    options = {
        autoResizeEngine: true,
        ...options,
    };

    const inspectorToken = {
        dispose: () => {},
    };

    let parentElement = options.containerElement ?? null;
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

    if (!parentElement) {
        return inspectorToken;
    }

    const existingToken = InspectorTokens.get(scene);
    if (existingToken) {
        existingToken.dispose();
        InspectorTokens.delete(scene);
    }

    InspectorTokens.set(scene, inspectorToken);

    const disposeActions: (() => void)[] = [];

    const canvasContainerDisplay = parentElement.style.display;
    const canvasContainerChildren: ChildNode[] = [];

    canvasContainerChildren.push(...parentElement.childNodes);

    disposeActions.push(() => {
        canvasContainerChildren.forEach((child) => parentElement.appendChild(child));
    });

    // This service is responsible for injecting the passed in canvas as the "central content" of the shell UI (the main area between the side panes and toolbars).
    const canvasInjectorServiceDefinition: ServiceDefinition<[], [IShellService]> = {
        friendlyName: "Canvas Injector",
        consumes: [ShellServiceIdentity],
        factory: (shellService) => {
            const useStyles = makeStyles({
                canvasContainer: {
                    display: canvasContainerDisplay,
                    width: "100%",
                    height: "100%",
                },
            });

            const registration = shellService.addCentralContent({
                key: "Canvas Injector",
                component: () => {
                    const classes = useStyles();
                    const canvasContainerRef = useRef<HTMLDivElement>(null);
                    useEffect(() => {
                        if (canvasContainerRef.current) {
                            for (const child of canvasContainerChildren) {
                                canvasContainerRef.current.appendChild(child);
                            }
                        }
                    }, []);

                    return <div ref={canvasContainerRef} className={classes.canvasContainer} />;
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

    let disposed = false;
    inspectorToken.dispose = () => {
        if (disposed) {
            return;
        }

        disposeActions.reverse().forEach((dispose) => dispose());
        if (options.autoResizeEngine) {
            scene.getEngine().resize();
        }

        disposed = true;
    };

    const sceneDisposedObserver = scene.onDisposeObservable.addOnce(() => {
        inspectorToken.dispose();
    });

    disposeActions.push(() => sceneDisposedObserver.remove());

    disposeActions.push(() => {
        InspectorTokens.delete(scene);
    });

    return inspectorToken;
}
