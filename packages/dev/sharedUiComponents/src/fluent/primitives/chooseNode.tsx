import type { FunctionComponent } from "react";
import type { Scene } from "core/scene";
import type { Nullable } from "core/types";
import type { Node } from "core/node";
import type { PrimitiveProps } from "./primitive";

import { useCallback } from "react";
import { ChooseEntity } from "./chooseEntity";

export type ChooseNodeProps = PrimitiveProps<Nullable<Node>> & {
    /**
     * The scene to get nodes from
     */
    scene: Scene;
    /**
     * Optional filter function to filter which nodes are shown
     */
    filter?: (node: Node) => boolean;
};

/**
 * A primitive component with a ComboBox for selecting from existing scene nodes.
 * @param props ChooseNodeProps
 * @returns ChooseNode component
 */
export const ChooseNode: FunctionComponent<ChooseNodeProps> = (props) => {
    ChooseNode.displayName = "ChooseNode";
    const { scene, ...rest } = props;

    const getNodes = useCallback(() => scene.getNodes(), [scene]);
    const getName = useCallback((node: Node) => node.name, []);

    return <ChooseEntity {...rest} getEntities={getNodes} getName={getName} />;
};
