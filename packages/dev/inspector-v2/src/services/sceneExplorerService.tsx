// eslint-disable-next-line import/no-internal-modules
import type { Node, Scene } from "core/index";

import type { TreeItemValue, TreeOpenChangeData, TreeOpenChangeEvent } from "@fluentui/react-components";
import type { FunctionComponent } from "react";
import type { Service, ServiceDefinition } from "../modularity/serviceDefinition";

import { Button, FlatTree, FlatTreeItem, makeStyles, Text, tokens, TreeItemLayout } from "@fluentui/react-components";
import { VirtualizerScrollView } from "@fluentui/react-components/unstable";
import { BoxRegular, BranchRegular, CameraRegular, CubeTreeRegular, EyeRegular, ImageRegular, LightbulbRegular, PaintBrushRegular, SquareRegular } from "@fluentui/react-icons";
import { Camera } from "core/Cameras/camera";
import { Light } from "core/Lights/light";
import { BaseTexture } from "core/Materials/Textures/baseTexture";
import { Material } from "core/Materials/material";
import { AbstractMesh } from "core/Meshes/abstractMesh";
import { TransformNode } from "core/Meshes/transformNode";
import { useCallback, useMemo, useState } from "react";
import { useObservableState } from "../hooks/observableHooks";
import { TraverseGraph } from "../misc/graphUtils";
import { SceneContext } from "./sceneContext";
import { ShellService } from "./shellService";

export const SceneExplorer = Symbol("SceneExplorer");
export interface SceneExplorer extends Service<typeof SceneExplorer> {
    // TODO: Expose extensibility points
}

function getNodeDepth(node: Node): number {
    let depth = 0;
    for (let parent = node.parent; parent; parent = parent.parent) {
        depth++;
    }
    return depth;
}

type TreeItemData = "Nodes" | "Materials" | "Textures" | Node | Material | BaseTexture;

const useStyles = makeStyles({
    rootDiv: {
        flex: 1,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
    },
    tree: {
        margin: tokens.spacingHorizontalXS,
        rowGap: 0,
        overflow: "hidden",
        flex: 1,
    },
});

export const SceneExplorerServiceDefinition: ServiceDefinition<[], [SceneContext, ShellService]> = {
    friendlyName: "Scene Explorer",
    tags: ["diagnostics"],
    consumes: [SceneContext, ShellService],
    // produces: [SceneExplorer],
    factory: (sceneContext, shellService) => {
        // eslint-disable-next-line @typescript-eslint/naming-convention, jsdoc/require-jsdoc
        const SceneExplorer: FunctionComponent<{ scene: Scene }> = ({ scene }) => {
            const classes = useStyles();

            // TODO: Probably replace all this state with:
            // 1. A reducer that manages the open items and visible items (nodes, materials, etc.)
            // 2. An effect that calls the reducer to update the visible items when the scene changes
            // 3. A callback that calls the reducer and in turn is called from onOpenChange
            // Presumably we also need to call the reducer when the filter text changes, so we probably just want to always rebuild.
            // For the filter, we should maybe to the traversal but use onAfterNode so that if the filter matches, we make sure to include the full parent chain.
            // Then just reverse the array of nodes before returning it.

            const [openItems, setOpenItems] = useState(new Set<TreeItemValue>());

            // TODO: Handle nodes being dynamically added/removed from the scene
            // const [visibleItems, setVisibleItems] = useState(["Nodes", "Materials", "Textures"]);
            const [hasPendingSceneMutation, setHasPendingSceneMutation] = useState(false);

            const [itemsFilter, setItemsFilter] = useState("");

            const visibleItems = useMemo(() => {
                const visibleItems: TreeItemData[] = [];

                visibleItems.push("Nodes");
                if (openItems.has("Nodes")) {
                    TraverseGraph(
                        scene.rootNodes,
                        (node) => {
                            if (openItems.has(node.uniqueId)) {
                                return node.getChildren();
                            }
                            return null;
                        },
                        (node) => {
                            visibleItems.push(node);
                        }
                    );
                }

                visibleItems.push("Materials");
                if (openItems.has("Materials")) {
                    visibleItems.push(...scene.materials);
                }

                visibleItems.push("Textures");
                if (openItems.has("Textures")) {
                    visibleItems.push(...scene.textures);
                }

                return visibleItems;
            }, [scene, openItems, hasPendingSceneMutation, itemsFilter]);

            const onOpenChange = useCallback(
                (event: TreeOpenChangeEvent, data: TreeOpenChangeData) => {
                    if (data.type !== "Click" && data.type !== "Enter") {
                        setOpenItems(data.openItems);
                    }
                },
                [setOpenItems]
            );

            return (
                <div className={classes.rootDiv}>
                    <FlatTree className={classes.tree} openItems={openItems} onOpenChange={onOpenChange} aria-label="Scene Explorer Tree">
                        <VirtualizerScrollView numItems={visibleItems.length} itemSize={32} container={{ style: { overflowX: "hidden" } }}>
                            {(index: number) => {
                                const item = visibleItems[index];
                                if (item === "Nodes") {
                                    return (
                                        <FlatTreeItem
                                            key="Nodes"
                                            value="Nodes"
                                            itemType={scene.rootNodes.length > 0 ? "branch" : "leaf"}
                                            aria-level={1}
                                            aria-setsize={1}
                                            aria-posinset={1}
                                        >
                                            <TreeItemLayout>
                                                <Text weight="bold">Nodes</Text>
                                            </TreeItemLayout>
                                        </FlatTreeItem>
                                    );
                                } else if (item === "Materials") {
                                    return (
                                        <FlatTreeItem
                                            key="Materials"
                                            value="Materials"
                                            itemType={scene.materials.length > 0 ? "branch" : "leaf"}
                                            aria-level={1}
                                            aria-setsize={1}
                                            aria-posinset={1}
                                        >
                                            <TreeItemLayout>
                                                <Text weight="bold">Materials</Text>
                                            </TreeItemLayout>
                                        </FlatTreeItem>
                                    );
                                } else if (item === "Textures") {
                                    return (
                                        <FlatTreeItem
                                            key="Textures"
                                            value="Textures"
                                            itemType={scene.textures.length > 0 ? "branch" : "leaf"}
                                            aria-level={1}
                                            aria-setsize={1}
                                            aria-posinset={1}
                                        >
                                            <TreeItemLayout>
                                                <Text weight="bold">Textures</Text>
                                            </TreeItemLayout>
                                        </FlatTreeItem>
                                    );
                                } else if (item instanceof Material) {
                                    return (
                                        <FlatTreeItem
                                            key={item.uniqueId}
                                            value={item.uniqueId}
                                            itemType="leaf"
                                            parentValue="Materials"
                                            aria-level={2}
                                            aria-setsize={1}
                                            aria-posinset={1}
                                        >
                                            <TreeItemLayout iconBefore={<PaintBrushRegular />}>
                                                <Text>{item.name}</Text>
                                            </TreeItemLayout>
                                        </FlatTreeItem>
                                    );
                                } else if (item instanceof BaseTexture) {
                                    return (
                                        <FlatTreeItem
                                            key={item.uniqueId}
                                            value={item.uniqueId}
                                            itemType="leaf"
                                            parentValue="Textures"
                                            aria-level={2}
                                            aria-setsize={1}
                                            aria-posinset={1}
                                        >
                                            <TreeItemLayout iconBefore={<ImageRegular />}>
                                                <Text>{item.displayName || item.name || `Unnamed Texture (${item.uniqueId})`}</Text>
                                            </TreeItemLayout>
                                        </FlatTreeItem>
                                    );
                                } else {
                                    const icon =
                                        item instanceof AbstractMesh ? (
                                            <BoxRegular />
                                        ) : item instanceof TransformNode ? (
                                            <BranchRegular />
                                        ) : item instanceof Camera ? (
                                            <CameraRegular />
                                        ) : item instanceof Light ? (
                                            <LightbulbRegular />
                                        ) : (
                                            <></>
                                        );

                                    const actions =
                                        item instanceof AbstractMesh ? (
                                            <>
                                                <Button icon={<SquareRegular />} appearance="subtle" />
                                                <Button icon={<EyeRegular />} appearance="subtle" />
                                            </>
                                        ) : undefined;

                                    return (
                                        <FlatTreeItem
                                            key={item.uniqueId}
                                            value={item.uniqueId}
                                            itemType={item.getChildren().length > 0 ? "branch" : "leaf"}
                                            parentValue={item.parent ? item.parent.uniqueId : "Nodes"}
                                            aria-level={getNodeDepth(item) + 2}
                                            aria-setsize={1}
                                            aria-posinset={1}
                                        >
                                            <TreeItemLayout iconBefore={icon} actions={actions}>
                                                <Text>{item.name}</Text>
                                            </TreeItemLayout>
                                        </FlatTreeItem>
                                    );
                                }
                            }}
                        </VirtualizerScrollView>
                    </FlatTree>
                </div>
            );
        };

        const registration = shellService.addToLeftPane({
            key: "Scene Explorer",
            title: "Scene Explorer",
            icon: CubeTreeRegular,
            suppressTeachingMoment: true,
            content: () => {
                const scene = useObservableState(() => sceneContext.currentScene, sceneContext.currentSceneObservable);
                return <>{scene && <SceneExplorer scene={scene} />}</>;
            },
        });

        return {
            dispose: () => registration.dispose(),
        };
    },
};
