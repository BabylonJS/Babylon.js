/* eslint-disable jsdoc/require-jsdoc */

import type { FunctionComponent } from "react";
import { ColorPropertyLine } from "../hoc/colorPropertyLine";
import { type AbstractMesh } from "core/Meshes";

export const MeshOutlineOverlayProperties: FunctionComponent<{ entity: AbstractMesh }> = ({ entity: mesh }) => {
    return (
        <>
            <ColorPropertyLine color={mesh.overlayColor} label="Overlay Color" />
            <ColorPropertyLine color={mesh.outlineColor} label="Outline Color" />
        </>
    );
};
