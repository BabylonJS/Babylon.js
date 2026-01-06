import type { FunctionComponent } from "react";
import type { Scene } from "core/scene";
import type { Nullable } from "core/types";
import type { Skeleton } from "core/Bones/skeleton";
import type { PrimitiveProps } from "./primitive";
import type { EntitySelectorProps } from "./entitySelector";

import { useCallback } from "react";
import { EntitySelector } from "./entitySelector";

export type SkeletonSelectorProps = PrimitiveProps<Nullable<Skeleton>> & {
    /**
     * The scene to get skeletons from
     */
    scene: Scene;
    /**
     * Optional filter function to filter which skeletons are shown
     */
    filter?: (skeleton: Skeleton) => boolean;
} & Omit<EntitySelectorProps<Skeleton>, "getEntities" | "getName">;

/**
 * A primitive component with a ComboBox for selecting from existing scene skeletons.
 * @param props SkeletonSelectorProps
 * @returns SkeletonSelector component
 */
export const SkeletonSelector: FunctionComponent<SkeletonSelectorProps> = (props) => {
    SkeletonSelector.displayName = "SkeletonSelector";
    const { scene, ...rest } = props;

    const getSkeletons = useCallback(() => scene.skeletons, [scene.skeletons]);
    const getName = useCallback((skeleton: Skeleton) => skeleton.name, []);

    return <EntitySelector {...rest} getEntities={getSkeletons} getName={getName} />;
};
