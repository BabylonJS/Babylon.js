// eslint-disable-next-line import/no-internal-modules
import type { Node, Scene } from "core/index";
import type { Service, ServiceDefinition } from "../modularity/serviceDefinition";
import type { TreeItemValue, TreeOpenChangeEvent, TreeOpenChangeData } from "@fluentui/react-components";
import type { FunctionComponent } from "react";

import { FlatTree, FlatTreeItem, TreeItemLayout, makeStyles, Text, tokens, Button } from "@fluentui/react-components";
import { CubeTreeRegular, ImageRegular, PaintBrushRegular, BoxRegular, BranchRegular, CameraRegular, LightbulbRegular, EyeRegular, SquareRegular } from "@fluentui/react-icons";
import { SceneContext } from "./sceneContext";
import { ShellService } from "./shellService";
import { useObservableState } from "../hooks/observableHooks";
import { TraverseGraph } from "../misc/graphUtils";
import { useCallback, useMemo, useState } from "react";
import { AbstractMesh } from "core/Meshes/abstractMesh";
import { TransformNode } from "core/Meshes/transformNode";
import { Camera } from "core/Cameras/camera";
import { Light } from "core/Lights/light";

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

function getNodeIcon(node: Node): JSX.Element {
    if (node instanceof AbstractMesh) {
        return <BoxRegular />;
    } else if (node instanceof TransformNode) {
        return <BranchRegular />;
    } else if (node instanceof Camera) {
        return <CameraRegular />;
    } else if (node instanceof Light) {
        return <LightbulbRegular />;
    }

    return <></>;
}

const useStyles = makeStyles({
    rootDiv: {
        // ...shorthands.borderWidth("5px"),
        // ...shorthands.borderColor("red"),
        flex: "1 1 100%",
    },
    tree: {
        margin: tokens.spacingHorizontalXS,
        rowGap: 0,
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

            const rootNodes = useObservableState(
                () => scene.rootNodes,
                scene.onNewTransformNodeAddedObservable,
                scene.onTransformNodeRemovedObservable,
                scene.onNewMeshAddedObservable,
                scene.onMeshRemovedObservable,
                scene.onNewCameraAddedObservable,
                scene.onCameraRemovedObservable,
                scene.onNewLightAddedObservable,
                scene.onLightRemovedObservable
            );
            const hasRootNodes = useMemo(() => rootNodes && rootNodes.length > 0, [rootNodes]);

            const materials = useObservableState(() => scene.materials, scene.onNewMaterialAddedObservable, scene.onMaterialRemovedObservable);
            const hasMaterials = useMemo(() => materials && materials.length > 0, [materials]);

            const textures = useObservableState(() => scene.textures, scene.onNewTextureAddedObservable, scene.onTextureRemovedObservable);
            const hasTextures = useMemo(() => textures && textures.length > 0, [textures]);

            const [openItems, setOpenItems] = useState<Set<TreeItemValue>>(new Set());

            // TODO: Handle nodes being dynamically added/removed from the scene

            const visibleNodes = useMemo(() => {
                const nodes: Node[] = [];
                if (openItems.has("Nodes")) {
                    TraverseGraph(
                        rootNodes,
                        (node) => {
                            if (openItems.has(node.uniqueId)) {
                                return node.getChildren();
                            }
                            return [];
                        },
                        (node) => {
                            nodes.push(node);
                        }
                    );
                }
                return nodes;
            }, [rootNodes, openItems]);

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
                        <FlatTreeItem value="Nodes" itemType={hasRootNodes ? "branch" : "leaf"} aria-level={1} aria-setsize={1} aria-posinset={1}>
                            <TreeItemLayout>
                                <Text weight="bold">Nodes</Text>
                            </TreeItemLayout>
                        </FlatTreeItem>
                        {visibleNodes.map((node) => (
                            <FlatTreeItem
                                key={node.uniqueId}
                                value={node.uniqueId}
                                itemType={node.getChildren().length > 0 ? "branch" : "leaf"}
                                parentValue={node.parent ? node.parent.uniqueId : "Nodes"}
                                aria-level={getNodeDepth(node) + 2}
                                aria-setsize={1}
                                aria-posinset={1}
                            >
                                <TreeItemLayout
                                    iconBefore={getNodeIcon(node)}
                                    actions={
                                        <>
                                            <Button icon={<SquareRegular />} appearance="subtle" />
                                            <Button icon={<EyeRegular />} appearance="subtle" />
                                        </>
                                    }
                                >
                                    <Text>{node.name}</Text>
                                </TreeItemLayout>
                            </FlatTreeItem>
                        ))}
                        <FlatTreeItem value="Materials" itemType={hasMaterials ? "branch" : "leaf"} aria-level={1} aria-setsize={1} aria-posinset={1}>
                            <TreeItemLayout>
                                <Text weight="bold">Materials</Text>
                            </TreeItemLayout>
                        </FlatTreeItem>
                        {openItems.has("Materials") && (
                            <>
                                {materials.map((material) => (
                                    <FlatTreeItem
                                        key={material.uniqueId}
                                        value={material.uniqueId}
                                        itemType="leaf"
                                        parentValue="Materials"
                                        aria-level={1}
                                        aria-setsize={1}
                                        aria-posinset={1}
                                    >
                                        <TreeItemLayout iconBefore={<PaintBrushRegular />}>
                                            <Text>{material.name}</Text>
                                        </TreeItemLayout>
                                    </FlatTreeItem>
                                ))}
                            </>
                        )}
                        <FlatTreeItem value="Textures" itemType={hasTextures ? "branch" : "leaf"} aria-level={1} aria-setsize={1} aria-posinset={1}>
                            <TreeItemLayout>
                                <Text weight="bold">Textures</Text>
                            </TreeItemLayout>
                        </FlatTreeItem>
                        {openItems.has("Textures") && (
                            <>
                                {textures.map((texture) => (
                                    <FlatTreeItem
                                        key={texture.uniqueId}
                                        value={texture.uniqueId}
                                        itemType="leaf"
                                        parentValue="Textures"
                                        aria-level={1}
                                        aria-setsize={1}
                                        aria-posinset={1}
                                    >
                                        <TreeItemLayout iconBefore={<ImageRegular />}>
                                            <Text>{texture.displayName || texture.name || `Unnamed Texture (${texture.uniqueId})`}</Text>
                                        </TreeItemLayout>
                                    </FlatTreeItem>
                                ))}
                            </>
                        )}
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
