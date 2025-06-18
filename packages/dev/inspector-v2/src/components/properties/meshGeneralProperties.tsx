// eslint-disable-next-line import/no-internal-modules
import type { AbstractMesh } from "core/index";

import type { FunctionComponent } from "react";

import { PropertyLine } from "shared-ui-components/fluent/hoc/propertyLine";
import { Switch } from "shared-ui-components/fluent/primitives/switch";
import { Link } from "shared-ui-components/fluent/primitives/link";

import { useObservableState } from "../../hooks/observableHooks";

export const MeshGeneralProperties: FunctionComponent<{ context: AbstractMesh }> = ({ context: mesh }) => {
    const isEnabled = useObservableState(() => mesh.isEnabled(false), mesh.onEnabledStateChangedObservable);

    // Use the observable to keep keep state up-to-date and re-render the component when it changes.
    const material = useObservableState(() => mesh.material, mesh.onMaterialChangedObservable);

    return (
        <>
            <PropertyLine key="MeshIsEnabled" label="Is enabled" description="Whether the mesh is enabled or not.">
                <Switch checked={isEnabled} onChange={(_, data) => mesh.setEnabled(data.checked)} />
            </PropertyLine>
            {material && (!material.reservedDataStore || !material.reservedDataStore.hidden) && (
                <PropertyLine key="Material" label="Material" description={`The material used by the mesh.`}>
                    <Link>{material.name}</Link>
                </PropertyLine>
            )}
        </>
    );
};
