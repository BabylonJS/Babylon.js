import type { FunctionComponent } from "react";

import type { MultiMaterial } from "core/Materials/multiMaterial";
import type { ISelectionService } from "../../../services/selectionService";
import { LinkPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/linkPropertyLine";

export const MultiMaterialChildrenProperties: FunctionComponent<{ multiMaterial: MultiMaterial; selectionService: ISelectionService }> = (props) => {
    const { multiMaterial, selectionService } = props;

    return (
        <>
            {multiMaterial.subMaterials.map((material, index) => (
                <LinkPropertyLine label={`Material #${index + 1}`} value={material!.name} onLink={() => (selectionService.selectedEntity = material)} />
            ))}
        </>
    );
};
