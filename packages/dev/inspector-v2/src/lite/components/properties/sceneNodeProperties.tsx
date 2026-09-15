import { setSubtreeVisible, type SceneNode } from "@babylonjs/lite";
import { type FunctionComponent } from "react";

import { TextInputPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/inputPropertyLine";
import { SwitchPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/switchPropertyLine";
import { useSetting } from "shared-ui-components/modularTool/hooks/settingsHooks";

import { BoundProperty, DerivedProperty } from "../../../components/properties/boundProperty";
import { UseDegreesSettingDescriptor, UseEulerSettingDescriptor } from "../../../services/globalSettings";
import { SetQuaternionValue, SetVector3Value } from "../../sceneEntityUtils";
import { QuaternionPropertyLine, Vector3PropertyLine } from "shared-ui-components/lite/fluent/hoc/propertyLines/vectorPropertyLine";

function GetPosition(node: SceneNode): readonly [number, number, number] {
    return [node.position.x, node.position.y, node.position.z];
}

function GetRotation(node: SceneNode): readonly [number, number, number, number] {
    return [node.rotationQuaternion.x, node.rotationQuaternion.y, node.rotationQuaternion.z, node.rotationQuaternion.w];
}

function GetScaling(node: SceneNode): readonly [number, number, number] {
    return [node.scaling.x, node.scaling.y, node.scaling.z];
}

function GetVisibility(node: SceneNode): boolean {
    return node.visible !== false;
}

function SetVisibility(node: SceneNode, visible: boolean): void {
    setSubtreeVisible(node, visible);
}

function SetPosition(node: SceneNode, value: Parameters<typeof SetVector3Value>[1]): void {
    SetVector3Value(node.position, value);
}

function SetRotation(node: SceneNode, value: Parameters<typeof SetQuaternionValue>[1]): void {
    SetQuaternionValue(node.rotationQuaternion, value);
}

function SetScaling(node: SceneNode, value: Parameters<typeof SetVector3Value>[1]): void {
    SetVector3Value(node.scaling, value);
}

export const SceneNodeGeneralProperties: FunctionComponent<{ node: SceneNode }> = (props) => {
    const { node } = props;

    return (
        <>
            <BoundProperty component={TextInputPropertyLine} label="Name" target={node} propertyKey="name" />
            <DerivedProperty component={SwitchPropertyLine} label="Visible" target={node} getValue={GetVisibility} setValue={SetVisibility} />
        </>
    );
};

export const SceneNodeTransformProperties: FunctionComponent<{ node: SceneNode }> = (props) => {
    const { node } = props;
    const [useDegrees] = useSetting(UseDegreesSettingDescriptor);
    const [useEuler] = useSetting(UseEulerSettingDescriptor);

    return (
        <>
            <DerivedProperty component={Vector3PropertyLine} label="Position" target={node} getValue={GetPosition} setValue={SetPosition} />
            <DerivedProperty
                component={QuaternionPropertyLine}
                label="Rotation"
                target={node}
                getValue={GetRotation}
                setValue={SetRotation}
                useDegrees={useDegrees}
                useEuler={useEuler}
            />
            <DerivedProperty component={Vector3PropertyLine} label="Scaling" target={node} getValue={GetScaling} setValue={SetScaling} step={0.1} />
        </>
    );
};
