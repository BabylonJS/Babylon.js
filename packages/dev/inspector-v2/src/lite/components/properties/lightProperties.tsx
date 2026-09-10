import { type DirectionalLight, type HemisphericLight, type LightBase, type PointLight, type SpotLight, type Vec3 } from "@babylonjs/lite";
import { type FunctionComponent } from "react";

import { NumberInputPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/inputPropertyLine";
import { TextPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/textPropertyLine";

import { BoundProperty, DerivedProperty } from "../../../components/properties/boundProperty";
import { SetVector3Value } from "../../sceneEntityUtils";
import { Color3PropertyLine } from "shared-ui-components/lite/fluent/hoc/propertyLines/colorPropertyLine";
import { Vector3PropertyLine } from "shared-ui-components/lite/fluent/hoc/propertyLines/vectorPropertyLine";

function GetVector3(value: Vec3): readonly [number, number, number] {
    return [value.x, value.y, value.z];
}

export const LightGeneralProperties: FunctionComponent<{ light: LightBase }> = (props) => {
    const { light } = props;
    return <TextPropertyLine label="Type" value={light.lightType} />;
};

export const DirectionalLightSetupProperties: FunctionComponent<{ light: DirectionalLight }> = (props) => {
    const { light } = props;
    return (
        <>
            <DerivedProperty component={Vector3PropertyLine} label="Position" target={light.position} getValue={GetVector3} setValue={SetVector3Value} />
            <DerivedProperty component={Vector3PropertyLine} label="Direction" target={light.direction} getValue={GetVector3} setValue={SetVector3Value} />
            <BoundProperty component={Color3PropertyLine} label="Diffuse" target={light} propertyKey="diffuse" isLinearMode />
            <BoundProperty component={Color3PropertyLine} label="Specular" target={light} propertyKey="specular" isLinearMode />
            <BoundProperty component={NumberInputPropertyLine} label="Intensity" target={light} propertyKey="intensity" />
        </>
    );
};

export const PointLightSetupProperties: FunctionComponent<{ light: PointLight }> = (props) => {
    const { light } = props;
    return (
        <>
            <DerivedProperty component={Vector3PropertyLine} label="Position" target={light.position} getValue={GetVector3} setValue={SetVector3Value} />
            <BoundProperty component={Color3PropertyLine} label="Diffuse" target={light} propertyKey="diffuse" isLinearMode />
            <BoundProperty component={Color3PropertyLine} label="Specular" target={light} propertyKey="specular" isLinearMode />
            <BoundProperty component={NumberInputPropertyLine} label="Intensity" target={light} propertyKey="intensity" />
            <BoundProperty component={NumberInputPropertyLine} label="Range" target={light} propertyKey="range" />
        </>
    );
};

export const SpotLightSetupProperties: FunctionComponent<{ light: SpotLight }> = (props) => {
    const { light } = props;
    return (
        <>
            <DerivedProperty component={Vector3PropertyLine} label="Position" target={light.position} getValue={GetVector3} setValue={SetVector3Value} />
            <DerivedProperty component={Vector3PropertyLine} label="Direction" target={light.direction} getValue={GetVector3} setValue={SetVector3Value} />
            <BoundProperty component={Color3PropertyLine} label="Diffuse" target={light} propertyKey="diffuse" isLinearMode />
            <BoundProperty component={Color3PropertyLine} label="Specular" target={light} propertyKey="specular" isLinearMode />
            <BoundProperty component={NumberInputPropertyLine} label="Intensity" target={light} propertyKey="intensity" />
            <BoundProperty component={NumberInputPropertyLine} label="Range" target={light} propertyKey="range" />
            <BoundProperty component={NumberInputPropertyLine} label="Angle" target={light} propertyKey="angle" unit="rad" min={0} max={Math.PI} />
            <BoundProperty component={NumberInputPropertyLine} label="Exponent" target={light} propertyKey="exponent" min={0} />
        </>
    );
};

export const HemisphericLightSetupProperties: FunctionComponent<{ light: HemisphericLight }> = (props) => {
    const { light } = props;
    return (
        <>
            <DerivedProperty component={Vector3PropertyLine} label="Direction" target={light.direction} getValue={GetVector3} setValue={SetVector3Value} />
            <BoundProperty component={Color3PropertyLine} label="Diffuse" target={light} propertyKey="diffuseColor" isLinearMode />
            <BoundProperty component={Color3PropertyLine} label="Specular" target={light} propertyKey="specularColor" isLinearMode />
            <BoundProperty component={Color3PropertyLine} label="Ground" target={light} propertyKey="groundColor" isLinearMode />
            <BoundProperty component={NumberInputPropertyLine} label="Intensity" target={light} propertyKey="intensity" />
        </>
    );
};
