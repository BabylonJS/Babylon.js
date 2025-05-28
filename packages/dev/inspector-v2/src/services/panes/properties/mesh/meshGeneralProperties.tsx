// eslint-disable-next-line import/no-internal-modules
import type { AbstractMesh } from "core/index";

import type { FunctionComponent } from "react";

import { BooleanProperty } from "../../../../components/booleanProperty";

export const MeshGeneralProperties: FunctionComponent<{ entity: AbstractMesh }> = ({ entity: mesh }) => {
    return (
        <BooleanProperty
            key="MeshIsEnabled"
            label="Is enabled"
            description="Determines whether a mesh is enabled within the scene"
            accessor={() => mesh.isEnabled(false)}
            mutator={(value) => mesh.setEnabled(value)}
            observable={mesh.onEnabledStateChangedObservable}
        />
    );
};
