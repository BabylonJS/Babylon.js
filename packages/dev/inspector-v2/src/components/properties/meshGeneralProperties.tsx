// eslint-disable-next-line import/no-internal-modules
import type { AbstractMesh } from "core/index";

import type { FunctionComponent } from "react";

import type { ISelectionService } from "../../services/selectionService";

import { SwitchPropertyLine } from "shared-ui-components/fluent/hoc/switchPropertyLine";
import { LinkPropertyLine } from "shared-ui-components/fluent/hoc/linkPropertyLine";

import { useObservableState } from "../../hooks/observableHooks";

export const MeshGeneralProperties: FunctionComponent<{ mesh: AbstractMesh; selectionService: ISelectionService }> = (props) => {
    const { mesh, selectionService } = props;

    const isEnabled = useObservableState(() => mesh.isEnabled(false), mesh.onEnabledStateChangedObservable);

    // Use the observable to keep keep state up-to-date and re-render the component when it changes.
    const material = useObservableState(() => mesh.material, mesh.onMaterialChangedObservable);

    return (
        <>
            <SwitchPropertyLine
                key="MeshIsEnabled"
                label="Is enabled"
                description="Whether the mesh is enabled or not."
                value={isEnabled}
                onChange={(checked) => mesh.setEnabled(checked)}
            />
            {material && (!material.reservedDataStore || !material.reservedDataStore.hidden) && (
                <LinkPropertyLine
                    key="Material"
                    label="Material"
                    description={`The material used by the mesh.`}
                    value={material.name}
                    onLink={() => (selectionService.selectedEntity = material)}
                />
            )}
        </>
    );
};
