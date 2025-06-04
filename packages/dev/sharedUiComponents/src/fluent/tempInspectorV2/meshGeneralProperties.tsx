/* eslint-disable jsdoc/require-jsdoc */
import type { FunctionComponent } from "react";
import { PropertyLine } from "../hoc/propertyLine";
import { Switch } from "../primitives/switch";
import { Dropdown } from "../primitives/dropdown";
import { type AbstractMesh } from "core/Meshes";

export const MeshGeneralProperties: FunctionComponent<{
    entity: AbstractMesh;
}> = ({ entity: mesh }) => {
    return (
        <>
            <PropertyLine label="Is Visible" description="Determines whether a mesh is visible">
                <Switch checked={mesh.isVisible} onChange={(ev) => (mesh.isVisible = ev.target.checked)} />
            </PropertyLine>
            <PropertyLine label="Fake Dropdown ">
                <Dropdown
                    options={[
                        { value: 1, label: "One" },
                        { value: 2, label: "Two" },
                    ]}
                    onSelect={() => {}}
                />
            </PropertyLine>
        </>
    );
};
