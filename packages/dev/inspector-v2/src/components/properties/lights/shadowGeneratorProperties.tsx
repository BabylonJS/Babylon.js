import type { FunctionComponent } from "react";

import type { Camera, IShadowGenerator, Nullable, ShadowLight } from "core/index";
import type { DropdownOption } from "shared-ui-components/fluent/primitives/dropdown";

import { useEffect, useState } from "react";

import { DirectionalLight } from "core/Lights/directionalLight";
import { CascadedShadowGenerator } from "core/Lights/Shadows/cascadedShadowGenerator";
import { ShadowGenerator } from "core/Lights/Shadows/shadowGenerator";
import { ButtonLine } from "shared-ui-components/fluent/hoc/buttonLine";
import { NumberDropdownPropertyLine, StringDropdownPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/dropdownPropertyLine";
import { useObservableState } from "../../../hooks/observableHooks";

import "core/Lights/Shadows/shadowGeneratorSceneComponent";

type ShadowGeneratorType = "Default" | "Cascade";

const DefaultShadowGeneratorOptions = [{ label: "Shadow Generator", value: "Default" satisfies ShadowGeneratorType }] as const satisfies DropdownOption<ShadowGeneratorType>[];

const DirectionalLightGeneratorOptions = [
    ...DefaultShadowGeneratorOptions,
    { label: "Cascaded Shadow Generator", value: "Cascade" satisfies ShadowGeneratorType },
] as const satisfies DropdownOption<ShadowGeneratorType>[];

const MapSizeOptions = [
    { label: "4096 x 4096", value: 4096 },
    { label: "2048 x 2048", value: 2048 },
    { label: "1024 x 1024", value: 1024 },
    { label: "512 x 512", value: 512 },
    { label: "256 x 256", value: 256 },
] as const satisfies DropdownOption<number>[];

type ShadowGeneratorSettings = {
    generatorType: ShadowGeneratorType; // Type of shadow generator
    mapSize: number; // Size of the shadow map
};

function GetShadowGenerator(camera: Nullable<Camera>, shadowLight: ShadowLight): Nullable<IShadowGenerator> {
    return shadowLight.getShadowGenerator(camera) ?? shadowLight.getShadowGenerators()?.values().next().value ?? null;
}

function CreateShadowGenerator(shadowLight: ShadowLight, settings: ShadowGeneratorSettings): void {
    const light = shadowLight;
    const scene = light.getScene();
    const internals = settings;
    const generatorType = internals.generatorType;
    const mapSize = internals.mapSize;
    const generator = generatorType === "Default" ? new ShadowGenerator(mapSize, light) : new CascadedShadowGenerator(mapSize, light as DirectionalLight);

    for (const m of scene.meshes) {
        if (m.infiniteDistance) {
            continue;
        }
        generator.addShadowCaster(m);
        if (!m.isAnInstance) {
            m.receiveShadows = true;
        }
    }
}

function DisposeShadowGenerator(camera: Nullable<Camera>, shadowLight: ShadowLight): void {
    GetShadowGenerator(camera, shadowLight)?.dispose();
}

export const ShadowGeneratorSetupProperties: FunctionComponent<{ context: ShadowLight }> = ({ context: shadowLight }) => {
    const defaultGeneratorType = DefaultShadowGeneratorOptions[0].value;
    const defaultMapSize = MapSizeOptions[0].value;
    const [shadowGeneratorSettings, setShadowGeneratorSettings] = useState<Readonly<ShadowGeneratorSettings>>({ generatorType: defaultGeneratorType, mapSize: defaultMapSize });
    const shadowGeneratorOptions = shadowLight instanceof DirectionalLight ? DirectionalLightGeneratorOptions : DefaultShadowGeneratorOptions;
    const camera = useObservableState(() => shadowLight.getScene().activeCamera, shadowLight.getScene().onActiveCameraChanged);
    const shadowGenerator = GetShadowGenerator(camera, shadowLight);
    const [hasShadowGenerator, setHasShadowGenerator] = useState(!!shadowGenerator);

    useEffect(() => {
        setHasShadowGenerator(!!shadowGenerator);
    }, [shadowGenerator]);

    return (
        <>
            {!hasShadowGenerator && (
                <>
                    <StringDropdownPropertyLine
                        label="Type"
                        options={shadowGeneratorOptions}
                        value={shadowGeneratorSettings.generatorType}
                        onChange={(value) => setShadowGeneratorSettings((prev) => ({ ...prev, generatorType: value as ShadowGeneratorType }))}
                    />
                    <NumberDropdownPropertyLine
                        label="Map Size"
                        options={MapSizeOptions}
                        value={shadowGeneratorSettings.mapSize}
                        onChange={(value) => setShadowGeneratorSettings((prev) => ({ ...prev, mapSize: value }))}
                    />
                    <ButtonLine
                        label="Create Generator"
                        onClick={() => {
                            CreateShadowGenerator(shadowLight, shadowGeneratorSettings);
                            setHasShadowGenerator(true);
                        }}
                    />
                </>
            )}
            {shadowGenerator && (
                <>
                    TODO: Not Implemented
                    <ButtonLine
                        label="Dispose Generator"
                        onClick={() => {
                            DisposeShadowGenerator(camera, shadowLight);
                            setHasShadowGenerator(false);
                        }}
                    />
                </>
            )}
        </>
    );
};
