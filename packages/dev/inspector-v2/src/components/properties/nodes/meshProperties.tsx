import type { FunctionComponent } from "react";

import type { Mesh, MorphTarget } from "core/index";

import { EditRegular } from "@fluentui/react-icons";

import { Constants } from "core/Engines/constants";
import { ButtonLine } from "shared-ui-components/fluent/hoc/buttonLine";
import { NumberDropdownPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/dropdownPropertyLine";
import { SyncedSliderPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/syncedSliderPropertyLine";
import { EditNodeGeometry, GetNodeGeometry } from "../../../misc/nodeGeometryEditor";
import { BoundProperty } from "../boundProperty";

export const MeshGeneralProperties: FunctionComponent<{ mesh: Mesh }> = (props) => {
    const { mesh } = props;

    const nodeGeometry = GetNodeGeometry(mesh);

    return <>{nodeGeometry && <ButtonLine label="Edit" icon={EditRegular} onClick={async () => await EditNodeGeometry(nodeGeometry, mesh.getScene())} />}</>;
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

export const MeshMorphTargetsProperties: FunctionComponent<{ mesh: Mesh }> = (props) => {
    const { mesh } = props;

    if (!mesh.morphTargetManager) {
        return null;
    }

    const morphTargets: MorphTarget[] = [];
    for (let index = 0; index < mesh.morphTargetManager.numTargets; index++) {
        const target = mesh.morphTargetManager.getTarget(index);
        if (target.hasPositions) {
            morphTargets.push(target);
        }
    }

    if (morphTargets.length === 0) {
        return null;
    }

    return (
        <>
            {morphTargets.map((target, index) => (
                <BoundProperty
                    key={index}
                    component={SyncedSliderPropertyLine}
                    label={target.name || `Target ${index}`}
                    description={`Influence of morph target "${target.name || `Target ${index}`}"`}
                    target={target}
                    propertyKey="influence"
                    min={0}
                    max={1}
                    step={0.01}
                />
            ))}
        </>
    );
};
