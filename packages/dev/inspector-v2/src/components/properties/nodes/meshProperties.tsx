import { type FunctionComponent, useCallback } from "react";

import { type Mesh, type MorphTarget } from "core/index";

import { EditRegular } from "@fluentui/react-icons";

import { Constants } from "core/Engines/constants";
import { ButtonLine } from "shared-ui-components/fluent/hoc/buttonLine";
import { NumberDropdownPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/dropdownPropertyLine";
import { NumberInputPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/inputPropertyLine";
import { SyncedSliderPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/syncedSliderPropertyLine";
import { TextPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/textPropertyLine";
import { useObservableState } from "shared-ui-components/modularTool/hooks/observableHooks";
import { EditNodeGeometry, GetNodeGeometry } from "../../../misc/nodeGeometryEditor";
import { type IGizmoService } from "../../../services/gizmoService";
import { BoundProperty } from "../boundProperty";

export const MeshGeneralProperties: FunctionComponent<{ mesh: Mesh; gizmoService: IGizmoService }> = (props) => {
    const { mesh, gizmoService } = props;

    const nodeGeometry = GetNodeGeometry(mesh);
    const gizmoMode = useObservableState(() => gizmoService.gizmoMode, gizmoService.onGizmoModeChanged);
    const boundingBoxSize = useObservableState(
        useCallback(() => {
            const boundingBox = mesh.getBoundingInfo().boundingBox;
            let minX = boundingBox.minimumWorld.x;
            let minY = boundingBox.minimumWorld.y;
            let minZ = boundingBox.minimumWorld.z;
            let maxX = boundingBox.maximumWorld.x;
            let maxY = boundingBox.maximumWorld.y;
            let maxZ = boundingBox.maximumWorld.z;

            for (const childMesh of mesh.getChildMeshes()) {
                if (childMesh.getTotalVertices() === 0) {
                    continue;
                }

                const childBoundingBox = childMesh.getBoundingInfo().boundingBox;
                minX = Math.min(minX, childBoundingBox.minimumWorld.x);
                minY = Math.min(minY, childBoundingBox.minimumWorld.y);
                minZ = Math.min(minZ, childBoundingBox.minimumWorld.z);
                maxX = Math.max(maxX, childBoundingBox.maximumWorld.x);
                maxY = Math.max(maxY, childBoundingBox.maximumWorld.y);
                maxZ = Math.max(maxZ, childBoundingBox.maximumWorld.z);
            }

            return `[${(maxX - minX).toFixed(2)}, ${(maxY - minY).toFixed(2)}, ${(maxZ - minZ).toFixed(2)}]`;
        }, [mesh]),
        gizmoMode === "boundingBox" ? mesh.onAfterWorldMatrixUpdateObservable : null
    );

    return (
        <>
            {nodeGeometry && <ButtonLine label="Edit" icon={EditRegular} onClick={async () => await EditNodeGeometry(nodeGeometry, mesh.getScene())} />}
            {gizmoMode === "boundingBox" && (
                <TextPropertyLine
                    label="Bounding Box Size"
                    description="The world-space dimensions of the mesh's bounding box, in X, Y, Z order."
                    value={boundingBoxSize}
                    title={boundingBoxSize}
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
            {morphTargets.map((target, index) => {
                const targetName = target.name || `Target ${index}`;
                return (
                    <BoundProperty
                        key={index}
                        component={NumberInputPropertyLine}
                        label={targetName}
                        description={`Influence of morph target "${targetName}"`}
                        target={target}
                        propertyKey="influence"
                        step={0.01}
                    />
                );
            })}
        </>
    );
};
