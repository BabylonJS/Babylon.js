import { type IDisposable, type IReadonlyObservable } from "core/index";

import { type ExplorerCommandProvider, type ExplorerNodeDescription } from "../../../components/explorer/explorerModel";
import { type IReadonlyObservableCollection, ObservableCollection } from "shared-ui-components/modularTool/misc/observableCollection";
import { type IService } from "shared-ui-components/modularTool/modularity/serviceDefinition";

/**
 * The unique identity symbol for the product-neutral Explorer service.
 * @experimental
 */
export const ExplorerServiceIdentity = Symbol("Explorer");

/**
 * Contributes Explorer nodes beneath compatible entity-backed parent nodes.
 *
 * Providers return ordinary {@link ExplorerNodeDescription}s, so each contribution may contain arbitrary
 * nested groups and items. Providers attach by parent entity rather than node id because structural groups
 * are presentation details owned by product adapters.
 * @experimental
 */
export type ExplorerNodeProvider<T extends object> = Readonly<{
    /** Controls this provider's position relative to other providers attached to the same parent. */
    order?: number;
    /** Returns whether this provider supports the parent entity. */
    predicate: (parent: unknown) => parent is T;
    /** Gets the Explorer nodes contributed beneath the parent entity. */
    getNodes: (parent: T) => readonly ExplorerNodeDescription[];
    /** Optionally notifies when the nodes returned by this provider may have changed. */
    onChanged?: IReadonlyObservable<unknown>;
}>;

/**
 * Allows hierarchy and commands to be contributed to an Explorer without depending on a product-specific API.
 *
 * The item/group terminology intentionally matches `ExplorerNodeKind`. Product adapters may expose
 * domain-specific aliases (such as entity/section), but a generic Explorer group is not necessarily a scene section.
 * @experimental
 */
export interface IExplorerService extends IService<typeof ExplorerServiceIdentity> {
    /**
     * Adds a provider that contributes nodes beneath compatible entity-backed Explorer nodes.
     * @param provider The node provider to add.
     * @returns A disposable that removes the node provider.
     */
    addNodeProvider<T extends object>(provider: ExplorerNodeProvider<T>): IDisposable;

    /**
     * Adds a command that can be executed on Explorer item nodes.
     * @param command The command provider to add.
     * @returns A disposable that removes the command provider.
     */
    addItemCommand<T extends object>(command: ExplorerCommandProvider<T>): IDisposable;

    /**
     * Adds a context-menu command that can be executed on Explorer group nodes.
     * @param command The command provider to add.
     * @returns A disposable that removes the command provider.
     */
    addGroupCommand<T extends string>(command: ExplorerCommandProvider<T, "contextMenu">): IDisposable;
}

/**
 * The shared Explorer service implementation and the command collections consumed by an Explorer pane.
 * @internal
 */
export type ExplorerServiceState = IExplorerService &
    Readonly<{
        nodeProviders: IReadonlyObservableCollection<ExplorerNodeProvider<object>>;
        itemCommandProviders: IReadonlyObservableCollection<ExplorerCommandProvider<object>>;
        groupCommandProviders: IReadonlyObservableCollection<ExplorerCommandProvider<string, "contextMenu">>;
        dispose: () => void;
    }>;

/**
 * Creates the product-neutral Explorer contribution service.
 * @returns The service implementation and its observable contribution collections.
 * @internal
 */
export function CreateExplorerService(): ExplorerServiceState {
    const nodeProviders = new ObservableCollection<ExplorerNodeProvider<object>>();
    const itemCommands = new ObservableCollection<ExplorerCommandProvider<object>>();
    const groupCommands = new ObservableCollection<ExplorerCommandProvider<string, "contextMenu">>();

    return {
        nodeProviders,
        itemCommandProviders: itemCommands,
        groupCommandProviders: groupCommands,
        addNodeProvider: (provider) => nodeProviders.add(provider as unknown as ExplorerNodeProvider<object>),
        addItemCommand: (command) => itemCommands.add(command as unknown as ExplorerCommandProvider<object>),
        addGroupCommand: (command) => groupCommands.add(command as unknown as ExplorerCommandProvider<string, "contextMenu">),
        dispose: () => {
            nodeProviders.dispose();
            itemCommands.dispose();
            groupCommands.dispose();
        },
    };
}

function ExtendNodeDescription(description: ExplorerNodeDescription, providers: readonly ExplorerNodeProvider<object>[]): ExplorerNodeDescription {
    const getChildren = description.getChildren;
    if (!getChildren && !description.entity) {
        return description;
    }

    return {
        ...description,
        getChildren: () => GetExplorerNodeChildren(description.entity, getChildren?.() ?? [], providers),
    };
}

/**
 * Combines product-owned children with shared provider contributions and recursively enables contributions
 * beneath every entity-backed descendant.
 * @param parent The entity represented by the parent node, if any.
 * @param children The children owned by the product adapter.
 * @param providers The shared node providers registered with the Explorer.
 * @returns The combined child node descriptions.
 * @internal
 */
export function GetExplorerNodeChildren(
    parent: object | undefined,
    children: readonly ExplorerNodeDescription[],
    providers: readonly ExplorerNodeProvider<object>[]
): readonly ExplorerNodeDescription[] {
    const contributedChildren = parent
        ? providers
              .filter((provider) => provider.predicate(parent))
              .sort((left, right) => (left.order ?? 0) - (right.order ?? 0))
              .flatMap((provider) => provider.getNodes(parent))
        : [];

    return [...children, ...contributedChildren].map((description) => ExtendNodeDescription(description, providers));
}
