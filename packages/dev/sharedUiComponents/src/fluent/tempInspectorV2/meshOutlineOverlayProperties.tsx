// eslint-disable-next-line import/no-internal-modules
import { type AbstractMesh } from "core/index";

import type { FunctionComponent } from "react";
import { ColorPropertyLine } from "../hoc/colorPropertyLine";

export const MeshOutlineOverlayProperties: FunctionComponent<{ entity: AbstractMesh }> = ({ entity: mesh }) => {
    return (
        <>
            <ColorPropertyLine color={mesh.overlayColor} label="Overlay Color" />
            <ColorPropertyLine color={mesh.outlineColor} label="Outline Color" />
        </>
    );
};
