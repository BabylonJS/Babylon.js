import type { FunctionComponent } from "react";

import type { Mesh } from "core/index";

import { Constants } from "core/Engines/constants";

import { SyncedSliderPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/syncedSliderPropertyLine";
import { NumberDropdownPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/dropdownPropertyLine";
import { BoundProperty } from "../boundProperty";

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
