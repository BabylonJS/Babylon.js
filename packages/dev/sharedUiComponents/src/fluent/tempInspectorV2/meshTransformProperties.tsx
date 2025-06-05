/* eslint-disable jsdoc/require-jsdoc */

import type { FunctionComponent } from "react";

import { VectorPropertyLine } from "../hoc/vectorPropertyLine";

import type { AbstractMesh } from "core/Meshes";

export const MeshTransformProperties: FunctionComponent<{ entity: AbstractMesh }> = ({ entity: mesh }) => {
    return (
        <>
            <VectorPropertyLine vector={mesh.position} label="Position" />
            <VectorPropertyLine vector={mesh.rotation} label="Rotation" min={-Math.PI} max={Math.PI} />
        </>
    );
};
