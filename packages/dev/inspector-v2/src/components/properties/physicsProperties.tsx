// eslint-disable-next-line import/no-internal-modules
import { PhysicsMotionType, PhysicsPrestepType, type TransformNode } from "core/index";
import { PropertyLine } from "shared-ui-components/fluent/hoc/propertyLine";

import type { FunctionComponent } from "react";
import { Dropdown, type DropdownOption } from "shared-ui-components/fluent/primitives/dropdown";
import { Vector3PropertyLine } from "shared-ui-components/fluent/hoc/vectorPropertyLine";
import { useInterceptObservable } from "../../hooks/instrumentationHooks";
import { useObservableState } from "../../hooks/observableHooks";
import type { Vector3 } from "core/Maths/math.vector";

type Vector3Keys<T> = { [P in keyof T]: T[P] extends Vector3 ? P : never }[keyof T];

// This helper hook gets the value of a Vector3 property from a target object and causes the component
// to re-render when the property changes or when the x/y/z components of the Vector3 change.
// eslint-disable-next-line @typescript-eslint/naming-convention
export function useVector3Property<T extends object, K extends Vector3Keys<T>>(target: T, propertyKey: K): Vector3 {
    const position = useObservableState(() => target[propertyKey] as Vector3, useInterceptObservable("property", target, propertyKey));
    useObservableState(() => position.x, useInterceptObservable("property", position, "x"));
    useObservableState(() => position.y, useInterceptObservable("property", position, "y"));
    useObservableState(() => position.z, useInterceptObservable("property", position, "z"));
    return position;
}

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

    const massProps = node.physicsBody.getMassProperties() as any;
    const centerOfMass = useVector3Property(massProps, "centerOfMass");
    const inertia = useVector3Property(massProps, "inertia");

    return (
        <>
            <PropertyLine label="Motion Type">
                <Dropdown
                    options={MotionOptions}
                    value={MotionOptions.find((opt) => opt.value === (node.physicsBody as any)._motionType) ?? MotionOptions[0]}
                    onChange={(option) => {
                        return node.physicsBody?.setMotionType(option.value as PhysicsMotionType);
                    }}
                />
            </PropertyLine>
            <PropertyLine label="Prestep Type">
                <Dropdown
                    options={PrestepOptions}
                    value={PrestepOptions.find((opt) => opt.value === (node.physicsBody as any)._prestepType) ?? PrestepOptions[0]}
                    onChange={(option) => {
                        return node.physicsBody?.setPrestepType(option.value as PhysicsPrestepType);
                    }}
                />
            </PropertyLine>
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
                            }}
                        />
                        <Vector3PropertyLine
                            label="Inertia"
                            value={inertia}
                            onChange={(v) => {
                                massProps.inertia = v;
                                node.physicsBody?.setMassProperties(massProps);
                            }}
                        />
                    </div>
                </PropertyLine>
            )}
        </>
    );
};
