// eslint-disable-next-line import/no-internal-modules
import type { AbstractMesh } from "core/index";

import type { FunctionComponent } from "react";

import { useObservableState } from "../../hooks/observableHooks";

export const MeshGeneralProperties: FunctionComponent<{ context: AbstractMesh }> = ({ context: mesh }) => {
    // Use the observable to keep keep state up-to-date and re-render the component when it changes.
    const material = useObservableState(() => mesh.material, mesh.onMaterialChangedObservable);

    return (
        // TODO: Use the new Fluent property line shared components.
        <>
            <div key="MeshIsEnabled">Is enabled: {mesh.isEnabled(false).toString()}</div>
            {material && (!material.reservedDataStore || !material.reservedDataStore.hidden) && <div key="Material">Material: {material.name}</div>}
        </>
    );
};
