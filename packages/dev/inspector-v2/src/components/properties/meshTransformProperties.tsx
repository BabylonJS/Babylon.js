// eslint-disable-next-line import/no-internal-modules
import type { AbstractMesh } from "core/index";

import type { FunctionComponent } from "react";

export const MeshTransformProperties: FunctionComponent<{ context: AbstractMesh }> = ({ context: mesh }) => {
    return (
        // TODO: Use the new Fluent property line shared components.
        <>
            <div key="PositionTransform">Position: {mesh.position.toString()}</div>
        </>
    );
};
