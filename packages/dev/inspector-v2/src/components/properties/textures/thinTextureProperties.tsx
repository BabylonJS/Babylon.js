import type { FunctionComponent } from "react";

import type { ThinTexture } from "core/index";
import type { DropdownOption } from "shared-ui-components/fluent/primitives/dropdown";

import { useCallback } from "react";

import { NumberDropdownPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/dropdownPropertyLine";
import { StringifiedPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/stringifiedPropertyLine";
import { Texture } from "core/Materials/Textures/texture";
import { useObservableState } from "../../../hooks/observableHooks";
import { useInterceptObservable } from "../../../hooks/instrumentationHooks";
import { Property } from "../boundProperty";

const SamplingMode = [
    { label: "Nearest", value: Texture.NEAREST_NEAREST }, // 1
    { label: "Linear", value: Texture.LINEAR_LINEAR }, // 2

    { label: "Linear & linear mip", value: Texture.LINEAR_LINEAR_MIPLINEAR }, // 3
    { label: "Linear & nearest mip", value: Texture.LINEAR_LINEAR_MIPNEAREST }, // 11

    { label: "Nearest & linear mip", value: Texture.NEAREST_NEAREST_MIPLINEAR }, // 8
    { label: "Nearest & nearest mip", value: Texture.NEAREST_NEAREST_MIPNEAREST }, // 4

    { label: "Nearest/Linear", value: Texture.NEAREST_LINEAR }, // 7
    { label: "Nearest/Linear & linear mip", value: Texture.NEAREST_LINEAR_MIPLINEAR }, // 6
    { label: "Nearest/Linear & nearest mip", value: Texture.NEAREST_LINEAR_MIPNEAREST }, // 5

    { label: "Linear/Nearest", value: Texture.LINEAR_NEAREST }, // 12
    { label: "Linear/Nearest & linear mip", value: Texture.LINEAR_NEAREST_MIPLINEAR }, // 10
    { label: "Linear/Nearest & nearest mip", value: Texture.LINEAR_NEAREST_MIPNEAREST }, // 9
] as const satisfies DropdownOption<number>[];

export const ThinTextureGeneralProperties: FunctionComponent<{ texture: ThinTexture }> = (props) => {
    const { texture } = props;

    return (
        <>
            <StringifiedPropertyLine label="Width" value={texture.getSize().width} units="px" />
            <StringifiedPropertyLine label="Height" value={texture.getSize().height} units="px" />
        </>
    );
};

export const ThinTextureSamplingProperties: FunctionComponent<{ texture: ThinTexture }> = (props) => {
    const { texture } = props;

    const samplingMode = useObservableState(
        useCallback(() => texture.samplingMode, [texture]),
        useInterceptObservable("function", texture, "updateSamplingMode")
    );
    return (
        <Property
            component={NumberDropdownPropertyLine}
            label="Sampling"
            propertyPath="samplingMode"
            value={samplingMode}
            options={SamplingMode}
            onChange={(value) => texture.updateSamplingMode(value)}
        />
    );
};
