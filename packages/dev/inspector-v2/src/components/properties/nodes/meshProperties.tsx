import type { FunctionComponent } from "react";

import type { Mesh, NodeGeometry } from "core/index";

import { EditRegular } from "@fluentui/react-icons";

import { Constants } from "core/Engines/constants";
import { ButtonLine } from "shared-ui-components/fluent/hoc/buttonLine";
import { NumberDropdownPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/dropdownPropertyLine";
import { SyncedSliderPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/syncedSliderPropertyLine";
import { BoundProperty } from "../boundProperty";

export const MeshGeneralProperties: FunctionComponent<{ mesh: Mesh }> = (props) => {
    const { mesh } = props;

    const nodeGeometry = mesh._internalMetadata?.nodeGeometry as NodeGeometry | undefined;

    return (
        <>
            {nodeGeometry && (
                <ButtonLine
                    label="Edit"
                    icon={EditRegular}
                    onClick={async () => {
                        const { NodeGeometryEditor } = await import("node-geometry-editor/nodeGeometryEditor");
                        NodeGeometryEditor.Show({ nodeGeometry: nodeGeometry, hostScene: mesh.getScene() });
                    }}
                />
            )}
        </>
    );
};

export const MeshDisplayProperties: FunctionComponent<{ mesh: Mesh }> = (props) => {
    const { mesh } = props;

    return (
        <>
            <BoundProperty
                component={SyncedSliderPropertyLine}
                label="Visibility"
                description={"Controls the visibility of the mesh. 0 is invisible, 1 is fully visible."}
                target={mesh}
                propertyKey="visibility"
                min={0}
                max={1}
                step={0.01}
            />
            <BoundProperty
                component={NumberDropdownPropertyLine}
                label="Orientation"
                description={"Controls the side orientation or winding order of the mesh."}
                target={mesh}
                propertyKey="sideOrientation"
                options={[
                    { value: Constants.MATERIAL_ClockWiseSideOrientation, label: "Clockwise" },
                    { value: Constants.MATERIAL_CounterClockWiseSideOrientation, label: "CounterClockwise" },
                ]}
            />
        </>
    );
};
