import type { FunctionComponent } from "react";
import type { Scene } from "core/scene";
import type { Nullable } from "core/types";
import type { Material } from "core/Materials/material";
import type { PrimitiveProps } from "./primitive";
import type { EntitySelectorProps } from "./entitySelector";

import { useCallback } from "react";
import { EntitySelector } from "./entitySelector";

export type MaterialSelectorProps = PrimitiveProps<Nullable<Material>> & {
    /**
     * The scene to get materials from
     */
    scene: Scene;
    /**
     * Optional filter function to filter which materials are shown
     */
    filter?: (material: Material) => boolean;
} & Omit<EntitySelectorProps<Material>, "getEntities" | "getName">;

/**
 * A primitive component with a ComboBox for selecting from existing scene materials.
 * @param props MaterialSelectorProps
 * @returns MaterialSelector component
 */
export const MaterialSelector: FunctionComponent<MaterialSelectorProps> = (props) => {
    MaterialSelector.displayName = "MaterialSelector";
    const { scene, ...rest } = props;

    const getMaterials = useCallback(() => scene.materials, [scene.materials]);
    const getName = useCallback((material: Material) => material.name, []);

    return <EntitySelector {...rest} getEntities={getMaterials} getName={getName} />;
};
