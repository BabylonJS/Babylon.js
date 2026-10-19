import { type DirectionalLight, type HemisphericLight, type LightBase, type PointLight, type SpotLight, type Vec3 } from "@babylonjs/lite";
import { type FunctionComponent } from "react";

import { NumberInputPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/inputPropertyLine";
import { TextPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/textPropertyLine";

import { BoundProperty, DerivedProperty } from "../../../components/properties/boundProperty";
import { SetVector3Value } from "../../sceneEntityUtils";
import { Color3PropertyLine, type Color3Value } from "shared-ui-components/lite/fluent/hoc/propertyLines/colorPropertyLine";
import { Vector3PropertyLine } from "shared-ui-components/lite/fluent/hoc/propertyLines/vectorPropertyLine";

type DirtyVector = Vec3 & { set(x: number, y: number, z: number): void };
type LightPropertyTarget = ({ direction: DirtyVector } | { position: DirtyVector }) & object;
type ColoredLight = DirectionalLight | PointLight | SpotLight;
type EditableLight = ColoredLight | HemisphericLight;
type RangedLight = PointLight | SpotLight;

function GetVector3(value: Vec3): readonly [number, number, number] {
    return [value.x, value.y, value.z];
}

/**
 * Updates a plain Babylon Lite light property and marks its GPU light data dirty through a public observable transform.
 * @param light The light to update.
 * @param propertyKey The property to update.
 * @param value The new property value.
 */
export function SetLightProperty<T extends LightPropertyTarget, K extends keyof T>(light: T, propertyKey: K, value: T[K]): void {
    light[propertyKey] = value;
    const dirtyVector = "direction" in light ? light.direction : light.position;
    dirtyVector.set(dirtyVector.x, dirtyVector.y, dirtyVector.z);
}

function GetDiffuse(light: ColoredLight): ColoredLight["diffuse"] {
    return light.diffuse;
}

function ToColorTuple(value: Color3Value): [number, number, number] {
    return "r" in value ? [value.r, value.g, value.b] : [value[0], value[1], value[2]];
}

function SetDiffuse(light: ColoredLight, value: Color3Value): void {
    SetLightProperty(light, "diffuse", ToColorTuple(value));
}

function GetSpecular(light: ColoredLight): ColoredLight["specular"] {
    return light.specular;
}

function SetSpecular(light: ColoredLight, value: Color3Value): void {
    SetLightProperty(light, "specular", ToColorTuple(value));
}

function GetIntensity(light: EditableLight): number {
    return light.intensity;
}

function SetIntensity(light: EditableLight, value: number): void {
    SetLightProperty(light, "intensity", value);
}

function GetRange(light: RangedLight): number {
    return light.range;
}

function SetRange(light: RangedLight, value: number): void {
    SetLightProperty(light, "range", value);
}

function GetExponent(light: SpotLight): number {
    return light.exponent;
}

function SetExponent(light: SpotLight, value: number): void {
    SetLightProperty(light, "exponent", value);
}

function GetDiffuseColor(light: HemisphericLight): HemisphericLight["diffuseColor"] {
    return light.diffuseColor;
}

function SetDiffuseColor(light: HemisphericLight, value: Color3Value): void {
    SetLightProperty(light, "diffuseColor", ToColorTuple(value));
}

function GetSpecularColor(light: HemisphericLight): HemisphericLight["specularColor"] {
    return light.specularColor;
}

function SetSpecularColor(light: HemisphericLight, value: Color3Value): void {
    SetLightProperty(light, "specularColor", ToColorTuple(value));
}

function GetGroundColor(light: HemisphericLight): HemisphericLight["groundColor"] {
    return light.groundColor;
}

function SetGroundColor(light: HemisphericLight, value: Color3Value): void {
    SetLightProperty(light, "groundColor", ToColorTuple(value));
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
            <DerivedProperty component={Color3PropertyLine} label="Diffuse" target={light} getValue={GetDiffuse} setValue={SetDiffuse} isLinearMode />
            <DerivedProperty component={Color3PropertyLine} label="Specular" target={light} getValue={GetSpecular} setValue={SetSpecular} isLinearMode />
            <DerivedProperty component={NumberInputPropertyLine} label="Intensity" target={light} getValue={GetIntensity} setValue={SetIntensity} />
        </>
    );
};

export const PointLightSetupProperties: FunctionComponent<{ light: PointLight }> = (props) => {
    const { light } = props;
    return (
        <>
            <DerivedProperty component={Vector3PropertyLine} label="Position" target={light.position} getValue={GetVector3} setValue={SetVector3Value} />
            <DerivedProperty component={Color3PropertyLine} label="Diffuse" target={light} getValue={GetDiffuse} setValue={SetDiffuse} isLinearMode />
            <DerivedProperty component={Color3PropertyLine} label="Specular" target={light} getValue={GetSpecular} setValue={SetSpecular} isLinearMode />
            <DerivedProperty component={NumberInputPropertyLine} label="Intensity" target={light} getValue={GetIntensity} setValue={SetIntensity} />
            <DerivedProperty component={NumberInputPropertyLine} label="Range" target={light} getValue={GetRange} setValue={SetRange} />
        </>
    );
};

export const SpotLightSetupProperties: FunctionComponent<{ light: SpotLight }> = (props) => {
    const { light } = props;
    return (
        <>
            <DerivedProperty component={Vector3PropertyLine} label="Position" target={light.position} getValue={GetVector3} setValue={SetVector3Value} />
            <DerivedProperty component={Vector3PropertyLine} label="Direction" target={light.direction} getValue={GetVector3} setValue={SetVector3Value} />
            <DerivedProperty component={Color3PropertyLine} label="Diffuse" target={light} getValue={GetDiffuse} setValue={SetDiffuse} isLinearMode />
            <DerivedProperty component={Color3PropertyLine} label="Specular" target={light} getValue={GetSpecular} setValue={SetSpecular} isLinearMode />
            <DerivedProperty component={NumberInputPropertyLine} label="Intensity" target={light} getValue={GetIntensity} setValue={SetIntensity} />
            <DerivedProperty component={NumberInputPropertyLine} label="Range" target={light} getValue={GetRange} setValue={SetRange} />
            <BoundProperty component={NumberInputPropertyLine} label="Angle" target={light} propertyKey="angle" unit="rad" min={0} max={Math.PI} />
            <DerivedProperty component={NumberInputPropertyLine} label="Exponent" target={light} getValue={GetExponent} setValue={SetExponent} min={0} />
        </>
    );
};

export const HemisphericLightSetupProperties: FunctionComponent<{ light: HemisphericLight }> = (props) => {
    const { light } = props;
    return (
        <>
            <DerivedProperty component={Vector3PropertyLine} label="Direction" target={light.direction} getValue={GetVector3} setValue={SetVector3Value} />
            <DerivedProperty component={Color3PropertyLine} label="Diffuse" target={light} getValue={GetDiffuseColor} setValue={SetDiffuseColor} isLinearMode />
            <DerivedProperty component={Color3PropertyLine} label="Specular" target={light} getValue={GetSpecularColor} setValue={SetSpecularColor} isLinearMode />
            <DerivedProperty component={Color3PropertyLine} label="Ground" target={light} getValue={GetGroundColor} setValue={SetGroundColor} isLinearMode />
            <DerivedProperty component={NumberInputPropertyLine} label="Intensity" target={light} getValue={GetIntensity} setValue={SetIntensity} />
        </>
    );
};
