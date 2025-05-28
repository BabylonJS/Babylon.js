// eslint-disable-next-line import/no-internal-modules
import type { AbstractMesh } from "core/index";

import type { FunctionComponent } from "react";

export const MeshTransformProperties: FunctionComponent<{ entity: AbstractMesh }> = ({ entity: mesh }) => {
    return <div key="PositionTransform">Position: {mesh.position.toString()}</div>;
};
