// eslint-disable-next-line import/no-internal-modules
import type { AbstractMesh } from "core/index";

import type { FunctionComponent } from "react";

export const MeshGeneralProperties: FunctionComponent<{ entity: AbstractMesh }> = ({ entity: mesh }) => {
    return (
        // TODO: Use the new Fluent property line shared components.
        <>
            <div key="MeshIsEnabled">Is enabled: {mesh.isEnabled(false).toString()}</div>
        </>
    );
};
