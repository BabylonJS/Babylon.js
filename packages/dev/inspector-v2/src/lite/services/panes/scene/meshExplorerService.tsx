import { removeFromScene, setParent, setSubtreeVisible, type SceneContext, type SceneNode } from "@babylonjs/lite";
import { tokens } from "@fluentui/react-components";
import { DeleteRegular, EyeOffRegular, EyeRegular, MyLocationRegular } from "@fluentui/react-icons";
import { type ServiceDefinition } from "shared-ui-components/modularTool/modularity/serviceDefinition";
import { MeshIcon } from "shared-ui-components/fluent/icons";

import { Observable } from "core/Misc/observable";
import { type ExplorerNodeDescription, GetEntityId } from "../../../../components/explorer/explorerModel";
import { type IEngineExplorerService, EngineExplorerServiceIdentity } from "../../../engineExplorerService";
import { EngineContextIdentity, type IEngineContext } from "../../../engineContext";
import { CreateWatchedNameDisplayInfo } from "../../../explorerDisplayInfo";
import { GetSceneContexts, GetSceneNodeRoots, IsMesh, IsSceneNode, IsSceneNodeDescendantOf } from "../../../sceneEntityUtils";
import { ExplorerServiceIdentity, type IExplorerService } from "../../../../services/panes/explorer/explorerService";
import { type ISelectionService, SelectionServiceIdentity } from "../../../../services/selectionService";
import { type IWatcherService, WatcherServiceIdentity } from "../../../../services/watcherService";
import { IsSceneContext } from "./sceneExplorerSection";

type NodeTopologyMarker = {
    parent: object | null;
    marker: object;
};

const NodeTopologyMarkers = new WeakMap<SceneNode, NodeTopologyMarker>();

function GetNodeTopologyMarker(node: SceneNode): object {
    const parent = IsSceneNode(node.parent) ? node.parent : null;
    const existing = NodeTopologyMarkers.get(node);
    if (existing?.parent === parent) {
        return existing.marker;
    }

    const marker = {};
    NodeTopologyMarkers.set(node, { parent, marker });
    return marker;
}

function CreateNodeDescription(node: SceneNode, watcherService: IWatcherService): ExplorerNodeDescription {
    return {
        id: GetEntityId(node).toString(),
        kind: "item",
        entity: node,
        icon: () => (IsMesh(node) ? <MeshIcon color={tokens.colorPaletteBlueForeground2} /> : <MyLocationRegular color={tokens.colorPaletteBlueForeground2} />),
        getDisplayInfo: () => CreateWatchedNameDisplayInfo(watcherService, node, () => node.name || (IsMesh(node) ? "Unnamed Mesh" : "Unnamed Transform Node")),
        getChildren: () => node.children.filter(IsSceneNode).map((child) => CreateNodeDescription(child, watcherService)),
    };
}

function ClearRemovedSelection(selectionService: ISelectionService, engineContext: IEngineContext, selectionWasRemoved: boolean): void {
    const selectedEntity = selectionService.selectedEntity;
    if (
        selectionWasRemoved &&
        !GetSceneContexts(engineContext.engine).some((scene) =>
            GetSceneNodeRoots(scene).some((root) => root === selectedEntity || (IsSceneNode(selectedEntity) && IsSceneNodeDescendantOf(selectedEntity, root)))
        )
    ) {
        selectionService.selectedEntity = null;
    }
}

export const MeshExplorerServiceDefinition: ServiceDefinition<[], [IEngineExplorerService, IExplorerService, IWatcherService, ISelectionService, IEngineContext]> = {
    friendlyName: "Babylon Lite Scene Node Explorer",
    consumes: [EngineExplorerServiceIdentity, ExplorerServiceIdentity, WatcherServiceIdentity, SelectionServiceIdentity, EngineContextIdentity],
    factory: (engineExplorerService, explorerService, watcherService, selectionService, engineContext) => {
        const providerRegistration = engineExplorerService.addRenderingContextNodeProvider({
            order: 0,
            predicate: IsSceneContext,
            getNodes: (scene) => {
                return [
                    {
                        id: "nodes",
                        kind: "group",
                        getDisplayInfo: () => ({ name: "Nodes" }),
                        getChildren: () => GetSceneNodeRoots(scene).map((node) => CreateNodeDescription(node, watcherService)),
                        dragDropConfig: {
                            canDrag: IsSceneNode,
                            canDrop: (draggedEntity, targetEntity) =>
                                IsSceneNode(draggedEntity) &&
                                (targetEntity === null || (IsSceneNode(targetEntity) && draggedEntity !== targetEntity && !IsSceneNodeDescendantOf(targetEntity, draggedEntity))) &&
                                draggedEntity.parent !== targetEntity,
                            onDrop: (draggedEntity, targetEntity) => {
                                if (IsSceneNode(draggedEntity) && (targetEntity === null || IsSceneNode(targetEntity))) {
                                    setParent(draggedEntity, targetEntity);
                                }
                            },
                        },
                    },
                ];
            },
            getSnapshot: (scene) =>
                GetSceneNodeRoots(scene)
                    .flatMap((root) => [root, ...GetNodeDescendants(root)])
                    .flatMap((node) => [node, GetNodeTopologyMarker(node)]),
        });

        const visibilityRegistration = explorerService.addItemCommand({
            predicate: (entity): entity is SceneNode => IsSceneNode(entity) && GetOwningScenes(engineContext, entity).length > 0,
            order: 1100,
            getCommand: (node) => {
                const onChange = new Observable<void>();
                const visibilityWatcher = watcherService.watchValue(
                    () => node.visible !== false,
                    () => onChange.notifyObservers()
                );

                return {
                    type: "toggle",
                    mode: "contextMenu",
                    get displayName() {
                        return node.visible === false ? "Show Node" : "Hide Node";
                    },
                    icon: () => (node.visible === false ? <EyeOffRegular /> : <EyeRegular />),
                    get isEnabled() {
                        return node.visible !== false;
                    },
                    set isEnabled(visible: boolean) {
                        setSubtreeVisible(node, visible);
                    },
                    onChange,
                    dispose: () => {
                        visibilityWatcher.dispose();
                        onChange.clear();
                    },
                };
            },
        });

        const removeRegistration = explorerService.addItemCommand({
            predicate: (entity): entity is SceneNode => IsSceneNode(entity) && GetOwningScenes(engineContext, entity).length === 1,
            order: 10000,
            getCommand: (node) => ({
                type: "action",
                mode: "contextMenu",
                displayName: "Remove from Scene",
                icon: DeleteRegular,
                hotKey: { keyCode: "Delete" },
                execute: () => {
                    const [scene] = GetOwningScenes(engineContext, node);
                    if (scene && GetOwningScenes(engineContext, node).length === 1) {
                        const selectedEntity = selectionService.selectedEntity;
                        const selectionWasRemoved = selectedEntity === node || (IsSceneNode(selectedEntity) && IsSceneNodeDescendantOf(selectedEntity, node));
                        removeFromScene(scene, node);
                        ClearRemovedSelection(selectionService, engineContext, selectionWasRemoved);
                    }
                },
            }),
        });

        return {
            dispose: () => {
                removeRegistration.dispose();
                visibilityRegistration.dispose();
                providerRegistration.dispose();
            },
        };
    },
};

function GetNodeDescendants(node: SceneNode): readonly SceneNode[] {
    return node.children.filter(IsSceneNode).flatMap((child) => [child, ...GetNodeDescendants(child)]);
}

function GetOwningScenes(engineContext: IEngineContext, node: SceneNode): readonly SceneContext[] {
    return GetSceneContexts(engineContext.engine).filter((scene) => GetSceneNodeRoots(scene).some((root) => root === node || IsSceneNodeDescendantOf(node, root)));
}
