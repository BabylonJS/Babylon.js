import type { FunctionComponent } from "react";
import type { Scene } from "core/scene";
import type { Nullable } from "core/types";
import type { Node } from "core/node";
import type { PrimitiveProps } from "./primitive";
import type { EntitySelectorProps } from "./entitySelector";

import { useCallback } from "react";
import { EntitySelector } from "./entitySelector";

export type NodeSelectorProps = PrimitiveProps<Nullable<Node>> & {
    /**
     * The scene to get nodes from
     */
    scene: Scene;
    /**
     * Optional filter function to filter which nodes are shown
     */
    filter?: (node: Node) => boolean;
} & Omit<EntitySelectorProps<Node>, "getEntities" | "getName">;

/**
 * A primitive component with a ComboBox for selecting from existing scene nodes.
 * @param props NodeSelectorProps
 * @returns NodeSelector component
 */
export const NodeSelector: FunctionComponent<NodeSelectorProps> = (props) => {
    NodeSelector.displayName = "NodeSelector";
    const { scene, ...rest } = props;

    const getNodes = useCallback(() => scene.getNodes(), [scene]);
    const getName = useCallback((node: Node) => node.name, []);

    return <EntitySelector {...rest} getEntities={getNodes} getName={getName} />;
};
