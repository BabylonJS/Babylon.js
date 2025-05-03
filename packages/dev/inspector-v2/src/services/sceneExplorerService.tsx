// eslint-disable-next-line import/no-internal-modules
import type { Node, Nullable, Scene } from "core/index";

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
import { Observable } from "core/Misc/observable";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useObservableState } from "../hooks/observableHooks";
import { TraverseGraph } from "../misc/graphUtils";
import { SceneContext } from "./sceneContext";
import { ShellService } from "./shellService";

export const SceneExplorerService = Symbol("SceneExplorer");
export interface SceneExplorerService extends Service<typeof SceneExplorerService> {
    readonly selectedEntity: Nullable<Node | Material | BaseTexture>;
    readonly onSelectedEntityChanged: Observable<void>;
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

// const treeItemLayoutCommonProps = {
//     selector: { style: { display: "none" } },
// } as const satisfies TreeItemLayoutProps;

export const SceneExplorerServiceDefinition: ServiceDefinition<[SceneExplorerService], [SceneContext, ShellService]> = {
    friendlyName: "Scene Explorer",
    tags: ["diagnostics"],
    produces: [SceneExplorerService],
    consumes: [SceneContext, ShellService],
    factory: (sceneContext, shellService) => {
        let selectedEntityState: Nullable<Node | Material | BaseTexture> = null;
        const selectedEntityObservable = new Observable<void>();
        const setSelectedItem = (item: Nullable<Node | Material | BaseTexture>) => {
            if (item !== selectedEntityState) {
                selectedEntityState = item;
                selectedEntityObservable.notifyObservers();
            }
        };

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

            const selectedItem = useObservableState(() => selectedEntityState, selectedEntityObservable);

            const [openItems, setOpenItems] = useState(new Set<TreeItemValue>());

            // TODO: Handle nodes being dynamically added/removed from the scene
            // const [visibleItems, setVisibleItems] = useState(["Nodes", "Materials", "Textures"]);
            const [sceneVersion, setSceneVersion] = useState(0);

            const [itemsFilter /*, setItemsFilter*/] = useState("");

            useEffect(() => {
                setSceneVersion((version) => version + 1);
            }, [scene]);

            useEffect(() => {
                const onSceneItemAdded = () => {
                    setSceneVersion((version) => version + 1);
                };

                const onSceneItemRemoved = (item: { uniqueId: number }) => {
                    setSceneVersion((version) => version + 1);

                    if (openItems.delete(item.uniqueId)) {
                        setOpenItems(new Set(openItems));
                    }

                    if (item === selectedItem) {
                        setSelectedItem(null);
                    }
                };

                const observers = [
                    scene.onNewMeshAddedObservable.add(onSceneItemAdded),
                    scene.onNewTransformNodeAddedObservable.add(onSceneItemAdded),
                    scene.onNewCameraAddedObservable.add(onSceneItemAdded),
                    scene.onNewLightAddedObservable.add(onSceneItemAdded),
                    scene.onNewMaterialAddedObservable.add(onSceneItemAdded),
                    scene.onNewTextureAddedObservable.add(onSceneItemAdded),

                    scene.onMeshRemovedObservable.add(onSceneItemRemoved),
                    scene.onTransformNodeRemovedObservable.add(onSceneItemRemoved),
                    scene.onCameraRemovedObservable.add(onSceneItemRemoved),
                    scene.onLightRemovedObservable.add(onSceneItemRemoved),
                    scene.onMaterialRemovedObservable.add(onSceneItemRemoved),
                    scene.onTextureRemovedObservable.add(onSceneItemRemoved),
                ] as const;

                return () => {
                    for (const observer of observers) {
                        observer.remove();
                    }
                };
            }, [scene, openItems]);

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
            }, [scene, sceneVersion, openItems, itemsFilter]);

            const onOpenChange = useCallback(
                (event: TreeOpenChangeEvent, data: TreeOpenChangeData) => {
                    if (data.type !== "Click" && data.type !== "Enter") {
                        setOpenItems(data.openItems);
                    } else {
                        // if (typeof data.value === "number") {
                        //         const node = scene.getTransformNodeByUniqueId(data.value);
                        //         if (node) {
                        //             selectedEntityState = node;
                        //             selectedEntityObservable.notifyObservers();
                        //             return;
                        //         }
                        //         const mesh = scene.getMeshByUniqueId(data.value);
                        //         if (mesh) {
                        //             selectedEntityState = mesh;
                        //             selectedEntityObservable.notifyObservers();
                        //             return;
                        //         }
                        //         selectedEntityState = null;
                        //         selectedEntityObservable.notifyObservers();
                        // }
                    }
                },
                [setOpenItems]
            );

            // const onCheckedChange = useCallback((event: TreeCheckedChangeEvent, data: TreeCheckedChangeData) => {
            //     // console.log(`${data.value} ${data.checked ? "checked" : "unchecked"}`);
            // }, []);

            return (
                <div className={classes.rootDiv}>
                    <FlatTree
                        className={classes.tree}
                        openItems={openItems}
                        onOpenChange={onOpenChange}
                        // selectionMode="single"
                        // onCheckedChange={onCheckedChange}
                        aria-label="Scene Explorer Tree"
                    >
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
                                            <TreeItemLayout /*{...treeItemLayoutCommonProps}*/>
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
                                            <TreeItemLayout /*{...treeItemLayoutCommonProps}*/>
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
                                            <TreeItemLayout /*{...treeItemLayoutCommonProps}*/>
                                                <Text weight="bold">Textures</Text>
                                            </TreeItemLayout>
                                        </FlatTreeItem>
                                    );
                                } else if (item instanceof Material) {
                                    const onItemClick = () => {
                                        setSelectedItem(item);
                                    };

                                    return (
                                        <FlatTreeItem
                                            key={item.uniqueId}
                                            value={item.uniqueId}
                                            itemType="leaf"
                                            parentValue="Materials"
                                            aria-level={2}
                                            aria-setsize={1}
                                            aria-posinset={1}
                                            onClick={onItemClick}
                                        >
                                            <TreeItemLayout
                                                style={item === selectedItem ? { backgroundColor: tokens.colorNeutralBackground1Selected } : undefined}
                                                /*{...treeItemLayoutCommonProps}*/
                                                iconBefore={<PaintBrushRegular />}
                                            >
                                                <Text wrap={false} truncate>
                                                    {item.name}
                                                </Text>
                                            </TreeItemLayout>
                                        </FlatTreeItem>
                                    );
                                } else if (item instanceof BaseTexture) {
                                    const onItemClick = () => {
                                        setSelectedItem(item);
                                    };

                                    return (
                                        <FlatTreeItem
                                            key={item.uniqueId}
                                            value={item.uniqueId}
                                            itemType="leaf"
                                            parentValue="Textures"
                                            aria-level={2}
                                            aria-setsize={1}
                                            aria-posinset={1}
                                            onClick={onItemClick}
                                        >
                                            <TreeItemLayout
                                                style={item === selectedItem ? { backgroundColor: tokens.colorNeutralBackground1Selected } : undefined}
                                                /*{...treeItemLayoutCommonProps}*/
                                                iconBefore={<ImageRegular />}
                                            >
                                                <Text wrap={false} truncate>
                                                    {(item.displayName || item.name || `Unnamed Texture (${item.uniqueId})`).substring(0, 100)}
                                                </Text>
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

                                    const onItemClick = () => {
                                        setSelectedItem(item);
                                    };

                                    return (
                                        <FlatTreeItem
                                            key={item.uniqueId}
                                            value={item.uniqueId}
                                            itemType={item.getChildren().length > 0 ? "branch" : "leaf"}
                                            parentValue={item.parent ? item.parent.uniqueId : "Nodes"}
                                            aria-level={getNodeDepth(item) + 2}
                                            aria-setsize={1}
                                            aria-posinset={1}
                                            onClick={onItemClick}
                                        >
                                            <TreeItemLayout
                                                style={item === selectedItem ? { backgroundColor: tokens.colorNeutralBackground1Selected } : undefined}
                                                /*{...treeItemLayoutCommonProps}*/
                                                iconBefore={icon}
                                                actions={actions}
                                            >
                                                <Text wrap={false} truncate>
                                                    {item.name}
                                                </Text>
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
            get selectedEntity() {
                return selectedEntityState;
            },
            onSelectedEntityChanged: selectedEntityObservable,
            dispose: () => registration.dispose(),
        };
    },
};
