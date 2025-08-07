import type { FunctionComponent } from "react";

import type { MultiMaterial } from "core/Materials/multiMaterial";
import type { ISelectionService } from "../../../services/selectionService";

import { LinkToEntityPropertyLine } from "../linkToEntityPropertyLine";

export const MultiMaterialChildrenProperties: FunctionComponent<{ multiMaterial: MultiMaterial; selectionService: ISelectionService }> = (props) => {
    const { multiMaterial, selectionService } = props;

    return (
        <>
            {multiMaterial.subMaterials
                .filter((material) => !!material)
                .map((material, index) => (
                    <LinkToEntityPropertyLine key={material.uniqueId} label={`Material #${index + 1}`} entity={material} selectionService={selectionService} />
                ))}
        </>
    );
};
