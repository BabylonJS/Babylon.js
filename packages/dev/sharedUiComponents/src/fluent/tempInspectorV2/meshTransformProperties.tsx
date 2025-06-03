// eslint-disable-next-line import/no-internal-modules

import { AbstractMesh } from "core/Meshes";
import type { FunctionComponent } from "react";
import { VectorPropertyLine } from "../hoc/vectorPropertyLine";

export const MeshTransformProperties: FunctionComponent<{ entity: AbstractMesh }> = ({ entity: mesh }) => {
    return (
        <>
            <VectorPropertyLine vector={mesh.position} label="Position" />
            <VectorPropertyLine vector={mesh.rotation} label="Rotation" min={-Math.PI} max={Math.PI} />
        </>
    );
};
