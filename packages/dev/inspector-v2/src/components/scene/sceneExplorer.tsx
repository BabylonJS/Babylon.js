// eslint-disable-next-line import/no-internal-modules
import type { IDisposable, Nullable, Scene } from "core/index";

import type { TreeItemValue, TreeOpenChangeData, TreeOpenChangeEvent } from "@fluentui/react-components";
import type { ComponentType, FunctionComponent } from "react";

import { Body1, Body1Strong, Button, FlatTree, FlatTreeItem, makeStyles, tokens, ToggleButton, Tooltip, TreeItemLayout } from "@fluentui/react-components";
import { VirtualizerScrollView } from "@fluentui/react-components/unstable";

import { useCallback, useEffect, useMemo, useState } from "react";
import { TraverseGraph } from "../../misc/graphUtils";

export type EntityBase = Readonly<{
    uniqueId: number;
}>;

export type SceneExplorerSection<T extends EntityBase> = Readonly<{
    /**
     * The display name of the section (e.g. "Nodes", "Materials", etc.).
     */
    displayName: string;

    /**
     * An optional order for the section, relative to other sections.
     * Defaults to 0.
     */
    order?: number;

    /**
     * A function that returns the root entities for this section.
     */
    getRootEntities: (scene: Scene) => readonly T[];

    /**
     * An optional function that returns the children of a given entity.
     */
    getEntityChildren?: (entity: T) => readonly T[];

    /**
     * A function that returns the display name for a given entity.
     */
    getEntityDisplayName: (entity: T) => string;

    /**
     * An optional icon component to render for the entity.
     */
    entityIcon?: ComponentType<{ entity: T }>;

    /**
     * A function that watches for changes in the scene and calls the provided callbacks when entities are added or removed.
     */
    watch: (scene: Scene, onAdded: (entity: T) => void, onRemoved: (entity: T) => void) => IDisposable;
}>;

type EntityCommandBase<T extends EntityBase> = Readonly<{
    /**
     * An optional order for the section, relative to other commands.
     * Defaults to 0.
     */
    order?: number;

    /**
     * A predicate function that determines if the command is applicable to the given entity.
     */
    predicate: (entity: unknown) => entity is T;

    /**
     * The display name of the command (e.g. "Delete", "Rename", etc.).
     */
    displayName: string;

    /**
     * An icon component to render for the command.
     */
    icon: ComponentType<{ entity: T }>;
}>;

type ActionCommand<T extends EntityBase> = EntityCommandBase<T> &
    Readonly<{
        type: "action";
        /**
         * The function that executes the command on the given entity.
         */
        execute: (scene: Scene, entity: T) => void;
    }>;

type ToggleCommand<T extends EntityBase> = EntityCommandBase<T> &
    Readonly<{
        type: "toggle";
        /**
         * A boolean indicating if the command is enabled.
         */
        isEnabled: (scene: Scene, entity: T) => boolean;

        /**
         * The function that sets the enabled state of the command on the given entity.
         */
        setEnabled: (scene: Scene, entity: T, enabled: boolean) => void;
    }>;

export type SceneExplorerEntityCommand<T extends EntityBase> = ActionCommand<T> | ToggleCommand<T>;

type TreeItemData =
    | {
          type: "section";
          sectionName: string;
          hasChildren: boolean;
      }
    | {
          type: "entity";
          entity: EntityBase;
          depth: number;
          parent: Nullable<TreeItemValue>;
          hasChildren: boolean;
          title: string;
          icon?: ComponentType<{ entity: EntityBase }>;
      };

// eslint-disable-next-line @typescript-eslint/naming-convention
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

const ActionCommand: FunctionComponent<{ command: ActionCommand<EntityBase>; entity: EntityBase; scene: Scene }> = (props) => {
    const { command, entity, scene } = props;

    return (
        <Tooltip key={command.displayName} content={command.displayName} relationship="label">
            <Button icon={<command.icon entity={entity} />} appearance="subtle" onClick={() => command.execute(scene, entity)} />
        </Tooltip>
    );
};

const ToggleCommand: FunctionComponent<{ command: ToggleCommand<EntityBase>; entity: EntityBase; scene: Scene }> = (props) => {
    const { command, entity, scene } = props;
    const [checked, setChecked] = useState(command.isEnabled(scene, entity));
    const toggle = useCallback(() => {
        setChecked((prev) => {
            const enabled = !prev;
            command.setEnabled(scene, entity, enabled);
            return enabled;
        });
    }, [setChecked]);

    return (
        <Tooltip content={command.displayName} relationship="label">
            <ToggleButton icon={<command.icon entity={entity} />} appearance="transparent" checked={checked} onClick={toggle} />
        </Tooltip>
    );
};

export const SceneExplorer: FunctionComponent<{
    sections: readonly SceneExplorerSection<EntityBase>[];
    commands: readonly SceneExplorerEntityCommand<EntityBase>[];
    scene: Scene;
    selectedEntity?: unknown;
    setSelectedEntity?: (entity: unknown) => void;
}> = (props) => {
    const classes = useStyles();

    const { sections, commands, scene, selectedEntity, setSelectedEntity } = props;

    const [openItems, setOpenItems] = useState(new Set<TreeItemValue>());

    const [sceneVersion, setSceneVersion] = useState(0);

    // For the filter, we should maybe to the traversal but use onAfterNode so that if the filter matches, we make sure to include the full parent chain.
    // Then just reverse the array of nodes before returning it.
    const [itemsFilter /*, setItemsFilter*/] = useState("");

    useEffect(() => {
        setSceneVersion((version) => version + 1);
    }, [scene]);

    useEffect(() => {
        const onSceneItemAdded = () => {
            setSceneVersion((version) => version + 1);
        };

        const onSceneItemRemoved = (item: EntityBase) => {
            setSceneVersion((version) => version + 1);

            if (openItems.delete(item.uniqueId)) {
                setOpenItems(new Set(openItems));
            }

            if (item === selectedEntity) {
                setSelectedEntity?.(null);
            }
        };

        const watchTokens = sections.map((section) => section.watch(scene, onSceneItemAdded, onSceneItemRemoved));

        return () => {
            for (const token of watchTokens) {
                token.dispose();
            }
        };
    }, [sections, openItems]);

    const visibleItems = useMemo(() => {
        const visibleItems: TreeItemData[] = [];
        const entityParents = new Map<EntityBase, EntityBase>();

        for (const section of sections) {
            visibleItems.push({
                type: "section",
                sectionName: section.displayName,
                hasChildren: section.getRootEntities(scene).length > 0,
            });

            if (openItems.has(section.displayName)) {
                let depth = 1;
                TraverseGraph(
                    section.getRootEntities(scene),
                    (entity) => {
                        if (openItems.has(entity.uniqueId) && section.getEntityChildren) {
                            const children = section.getEntityChildren(entity);
                            for (const child of children) {
                                entityParents.set(child, entity);
                            }
                            return section.getEntityChildren(entity);
                        }
                        return null;
                    },
                    (entity) => {
                        depth++;
                        visibleItems.push({
                            type: "entity",
                            entity,
                            depth,
                            parent: entityParents.get(entity)?.uniqueId ?? section.displayName,
                            hasChildren: !!section.getEntityChildren && section.getEntityChildren(entity).length > 0,
                            title: section.getEntityDisplayName(entity),
                            icon: section.entityIcon,
                        });
                    },
                    () => {
                        depth--;
                    }
                );
            }
        }

        return visibleItems;
    }, [scene, sceneVersion, sections, openItems, itemsFilter]);

    const onOpenChange = useCallback(
        (event: TreeOpenChangeEvent, data: TreeOpenChangeData) => {
            // This makes it so we only consider a click on the chevron to be expanding/collapsing an item, not clicking anywhere on the item.
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

                        if (item.type === "section") {
                            return (
                                <FlatTreeItem
                                    key={item.sectionName}
                                    value={item.sectionName}
                                    itemType={item.hasChildren ? "branch" : "leaf"}
                                    parentValue={undefined}
                                    aria-level={1}
                                    aria-setsize={1}
                                    aria-posinset={1}
                                >
                                    <TreeItemLayout>
                                        <Body1Strong wrap={false} truncate>
                                            {item.sectionName.substring(0, 100)}
                                        </Body1Strong>
                                    </TreeItemLayout>
                                </FlatTreeItem>
                            );
                        } else {
                            return (
                                <FlatTreeItem
                                    key={item.entity.uniqueId}
                                    value={item.entity.uniqueId}
                                    itemType={item.hasChildren ? "branch" : "leaf"}
                                    parentValue={item.parent ?? undefined}
                                    aria-level={item.depth}
                                    aria-setsize={1}
                                    aria-posinset={1}
                                    onClick={() => setSelectedEntity?.(item.entity)}
                                >
                                    <TreeItemLayout
                                        iconBefore={item.icon ? <item.icon entity={item.entity} /> : null}
                                        style={item.entity === selectedEntity ? { backgroundColor: tokens.colorNeutralBackground1Selected } : undefined}
                                        actions={commands
                                            .filter((command) => command.predicate(item.entity))
                                            .map((command) =>
                                                command.type === "action" ? (
                                                    <ActionCommand key={command.displayName} command={command} entity={item.entity} scene={scene} />
                                                ) : (
                                                    <ToggleCommand key={command.displayName} command={command} entity={item.entity} scene={scene} />
                                                )
                                            )}
                                    >
                                        <Body1 wrap={false} truncate>
                                            {item.title.substring(0, 100)}
                                        </Body1>
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
