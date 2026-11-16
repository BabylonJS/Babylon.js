import {
    getSceneBillboardSystems,
    getSceneDepthHostedSpriteLayers,
    getSceneTextRenderables,
    onSceneBillboardSystemsChanged,
    onSceneDepthHostedSpriteLayersChanged,
    onSceneTextRenderablesChanged,
    type SceneContext,
    type Sprite2DLayer,
    type BillboardSpriteSystem,
} from "@babylonjs/lite";
import { EyeOffRegular, EyeRegular, ImageRegular, LayerDiagonalPersonRegular, TextTRegular } from "@fluentui/react-icons";
import { type FunctionComponent } from "react";

import { Observable } from "core/Misc/observable";
import { type ServiceDefinition } from "shared-ui-components/modularTool/modularity/serviceDefinition";

import { type ISelectionService, SelectionServiceIdentity } from "../../../../services/selectionService";
import { type IExplorerService, ExplorerServiceIdentity } from "../../../../services/panes/explorer/explorerService";
import { type IWatcherService, WatcherServiceIdentity } from "../../../../services/watcherService";
import { type IEngineContext, EngineContextIdentity } from "../../../engineContext";
import { type IEngineExplorerService, EngineExplorerServiceIdentity } from "../../../engineExplorerService";
import { GetSceneContexts } from "../../../sceneEntityUtils";
import { GetEngineCustomRenderables, GetSceneCustomRenderables, IsSceneBillboardSystem, IsSceneSpriteLayer } from "../../../sceneRenderableUtils";
import { CreateSceneExplorerSectionNode, IsSceneContext } from "./sceneExplorerSection";

const TextIcon: FunctionComponent = () => <TextTRegular />;
const SpriteIcon: FunctionComponent = () => <LayerDiagonalPersonRegular />;
const BillboardIcon: FunctionComponent = () => <ImageRegular />;

export const SceneRenderableExplorerServiceDefinition: ServiceDefinition<[], [IEngineExplorerService, IExplorerService, IWatcherService, IEngineContext, ISelectionService]> = {
    friendlyName: "Babylon Lite Scene Renderable Explorer",
    consumes: [EngineExplorerServiceIdentity, ExplorerServiceIdentity, WatcherServiceIdentity, EngineContextIdentity, SelectionServiceIdentity],
    factory: (explorer, commands, watcher, engineContext, selection) => {
        const engine = engineContext.engine;
        const onChanged = new Observable<void>();
        const subscriptions = new Map<SceneContext, () => void>();
        let previousEntities = GetEngineCustomRenderables(engine);

        const reconcileSelection = () => {
            const entities = GetEngineCustomRenderables(engine);
            const selected = selection.selectedEntity;
            if (selected && previousEntities.some((entity) => entity === selected) && !entities.some((entity) => entity === selected)) {
                selection.selectedEntity = null;
            }
            previousEntities = entities;
        };
        const onMembershipChanged = () => {
            reconcileSelection();
            onChanged.notifyObservers();
        };
        const updateScenes = (scenes: readonly SceneContext[]) => {
            for (const [scene, unsubscribe] of subscriptions) {
                if (!scenes.includes(scene)) {
                    unsubscribe();
                    subscriptions.delete(scene);
                }
            }
            for (const scene of scenes) {
                if (!subscriptions.has(scene)) {
                    const unsubscribers = [
                        onSceneTextRenderablesChanged(scene, onMembershipChanged),
                        onSceneDepthHostedSpriteLayersChanged(scene, onMembershipChanged),
                        onSceneBillboardSystemsChanged(scene, onMembershipChanged),
                    ];
                    subscriptions.set(scene, () => unsubscribers.forEach((unsubscribe) => unsubscribe()));
                }
            }
            reconcileSelection();
        };
        const getScenes = () => [...new Set(GetSceneContexts(engine))];
        updateScenes(getScenes());
        const scenesWatcher = watcher.watchValue(
            getScenes,
            (scenes) => {
                updateScenes(scenes);
                onChanged.notifyObservers();
            },
            (left, right) => left.length === right.length && left.every((scene, index) => scene === right[index])
        );
        const entitiesWatcher = watcher.watchValue(
            () => GetEngineCustomRenderables(engine),
            () => reconcileSelection(),
            (left, right) => left.length === right.length && left.every((entity, index) => entity === right[index])
        );
        const registration = explorer.addRenderingContextNodeProvider({
            order: 330,
            predicate: IsSceneContext,
            getNodes: (scene) => {
                const text = getSceneTextRenderables(scene);
                const sprites = getSceneDepthHostedSpriteLayers(scene);
                const billboards = getSceneBillboardSystems(scene);
                return [
                    ...(text.length
                        ? [CreateSceneExplorerSectionNode("scene-text", "Text Renderables", text, (_, index) => ({ name: `Text Renderable ${index + 1}` }), TextIcon)]
                        : []),
                    ...(sprites.length
                        ? [
                              CreateSceneExplorerSectionNode(
                                  "scene-sprites",
                                  "Depth-hosted Sprite Layers",
                                  sprites,
                                  (_, index) => ({ name: `Sprite Layer ${index + 1}` }),
                                  SpriteIcon
                              ),
                          ]
                        : []),
                    ...(billboards.length
                        ? [
                              CreateSceneExplorerSectionNode(
                                  "scene-billboards",
                                  "Billboard Systems",
                                  billboards,
                                  (_, index) => ({ name: `Billboard System ${index + 1}` }),
                                  BillboardIcon
                              ),
                          ]
                        : []),
                ];
            },
            getSnapshot: GetSceneCustomRenderables,
            onChanged,
        });
        const visibilityRegistration = commands.addItemCommand({
            predicate: (entity): entity is Sprite2DLayer | BillboardSpriteSystem => IsSceneSpriteLayer(engine, entity) || IsSceneBillboardSystem(engine, entity),
            order: 1100,
            getCommand: (entity) => {
                const changed = new Observable<void>();
                const visibilityWatcher = watcher.watchProperty(entity, "visible", () => changed.notifyObservers());
                return {
                    type: "toggle",
                    mode: "contextMenu",
                    get displayName() {
                        return entity.visible ? "Hide" : "Show";
                    },
                    icon: () => (entity.visible ? <EyeRegular /> : <EyeOffRegular />),
                    get isEnabled() {
                        return entity.visible;
                    },
                    set isEnabled(value: boolean) {
                        entity.visible = value;
                    },
                    onChange: changed,
                    dispose: () => {
                        visibilityWatcher.dispose();
                        changed.clear();
                    },
                };
            },
        });
        return {
            dispose: () => {
                visibilityRegistration.dispose();
                registration.dispose();
                scenesWatcher.dispose();
                entitiesWatcher.dispose();
                subscriptions.forEach((unsubscribe) => unsubscribe());
                subscriptions.clear();
                onChanged.clear();
            },
        };
    },
};
