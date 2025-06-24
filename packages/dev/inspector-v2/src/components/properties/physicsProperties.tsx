// eslint-disable-next-line import/no-internal-modules
import { PhysicsMotionType, PhysicsPrestepType, type TransformNode } from "core/index";
import { PropertyLine } from "shared-ui-components/fluent/hoc/propertyLine";

import type { FunctionComponent } from "react";
import { Dropdown, type DropdownOption } from "shared-ui-components/fluent/primitives/dropdown";
import { Vector3PropertyLine } from "shared-ui-components/fluent/hoc/vectorPropertyLine";

import { useVector3Property, useColor3Property } from "../observableUtils";

const MotionTypesOptions: DropdownOption[] = [{ label: "Motion Type", value: "Motion Type" }];

const MotionOptions: DropdownOption[] = [
    { label: "Static", value: PhysicsMotionType.STATIC },
    { label: "Animated", value: PhysicsMotionType.ANIMATED },
    { label: "Dynamic", value: PhysicsMotionType.DYNAMIC },
];

const PrestepOptions: DropdownOption[] = [
    { label: "Disabled", value: PhysicsPrestepType.DISABLED },
    { label: "Teleport", value: PhysicsPrestepType.TELEPORT },
    { label: "Action", value: PhysicsPrestepType.ACTION },
];

/**
 * Physics properties
 * @param props transform node
 * @returns controls
 */
export const TransformNodePhysicsProperties: FunctionComponent<{ node: TransformNode }> = (props) => {
    const { node } = props;

    if (!node.physicsBody) {
        return <></>;
    }

    const massProps = node.physicsBody.getMassProperties();
    const centerOfMass = useVector3Property(massProps, "centerOfMass");
    const inertia = useVector3Property(massProps, "inertia");

    return (
        <>
            <Dropdown
                options={MotionTypesOptions}
                onSelect={(value) => {
                    node.physicsBody?.setMotionType(value as unknown as PhysicsMotionType);
                }}
                defaultValue={MotionOptions[0]}
            />
            <Dropdown
                options={PrestepOptions}
                onSelect={(value) => {
                    node.physicsBody?.setPrestepType(value as unknown as PhysicsPrestepType);
                }}
                defaultValue={PrestepOptions.find((opt) => opt.value === (node.physicsBody as any)._prestepType) ?? PrestepOptions[0]}
            />
            {/* Physics Mass Properties Controls */}
            {massProps && (
                <PropertyLine label="Mass">
                    <div style={{ marginTop: 12 }}>
                        <label>
                            Mass:
                            <input
                                type="number"
                                value={massProps.mass ?? ""}
                                min={0}
                                step={0.01}
                                onChange={(e) => {
                                    massProps.mass = parseFloat(e.target.value);
                                    node.physicsBody?.setMassProperties(massProps);
                                    // Optionally trigger a re-render or update
                                }}
                            />
                        </label>
                        <br />
                        <Vector3PropertyLine
                            label="Center of Mass"
                            value={centerOfMass}
                            onChange={(v) => {
                                massProps.centerOfMass = v;
                                node.physicsBody?.setMassProperties(massProps);
                                // Optionally trigger a re-render or update
                            }}
                        />
                        <Vector3PropertyLine
                            label="Inertia"
                            value={inertia}
                            onChange={(v) => {
                                massProps.inertia = v;
                                node.physicsBody?.setMassProperties(massProps);
                                // Optionally trigger a re-render or update
                            }}
                        />
                    </div>
                </PropertyLine>
            )}
        </>
    );
};
