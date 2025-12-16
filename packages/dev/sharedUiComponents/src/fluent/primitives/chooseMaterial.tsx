import type { FunctionComponent } from "react";
import type { Scene } from "core/scene";
import type { Nullable } from "core/types";
import type { Material } from "core/Materials/material";
import type { PrimitiveProps } from "./primitive";

import { useCallback } from "react";
import { ChooseEntity } from "./chooseEntity";

export type ChooseMaterialProps = PrimitiveProps<Nullable<Material>> & {
    /**
     * The scene to get materials from
     */
    scene: Scene;
    /**
     * Optional filter function to filter which materials are shown
     */
    filter?: (material: Material) => boolean;
};

/**
 * A primitive component with a ComboBox for selecting from existing scene materials.
 * @param props ChooseMaterialProps
 * @returns ChooseMaterial component
 */
export const ChooseMaterial: FunctionComponent<ChooseMaterialProps> = (props) => {
    ChooseMaterial.displayName = "ChooseMaterial";
    const { scene, ...rest } = props;

    const getMaterials = useCallback(() => scene.materials, [scene.materials]);
    const getName = useCallback((material: Material) => material.name, []);

    return <ChooseEntity {...rest} getEntities={getMaterials} getName={getName} />;
};
