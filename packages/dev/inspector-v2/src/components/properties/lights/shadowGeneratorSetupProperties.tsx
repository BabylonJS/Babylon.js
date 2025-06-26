// eslint-disable-next-line import/no-internal-modules
import type { ShadowLight } from "core/index";

import type { DropdownOption } from "shared-ui-components/fluent/primitives/dropdown";

import { useEffect, useState, type FunctionComponent } from "react";

import { DirectionalLight } from "core/Lights/directionalLight";
import { CascadedShadowGenerator } from "core/Lights/Shadows/cascadedShadowGenerator";
import { ShadowGenerator } from "core/Lights/Shadows/shadowGenerator";
import { ButtonLine } from "shared-ui-components/fluent/hoc/buttonLine";
import { DropdownPropertyLine } from "shared-ui-components/fluent/hoc/dropdownPropertyLine";
import { useObservableState } from "../../../hooks/observableHooks";

type ShadowGeneratorType = "Default" | "Cascade";

const DefaultShadowGeneratorOptions = [{ label: "Shadow Generator", value: "Default" satisfies ShadowGeneratorType }] as const satisfies DropdownOption[];

const DirectionalLightGeneratorOptions = [
    ...DefaultShadowGeneratorOptions,
    { label: "Cascaded Shadow Generator", value: "Cascade" satisfies ShadowGeneratorType },
] as const satisfies DropdownOption[];

const MapSizeOptions = [
    { label: "4096 x 4096", value: 4096 },
    { label: "2048 x 2048", value: 2048 },
    { label: "1024 x 1024", value: 1024 },
    { label: "512 x 512", value: 512 },
    { label: "256 x 256", value: 256 },
] as const satisfies DropdownOption[];

type ShadowGeneratorSettings = {
    generatorType: ShadowGeneratorType; // Type of shadow generator
    mapSize: number; // Size of the shadow map
};

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

export const ShadowGeneratorSetupProperties: FunctionComponent<{ context: ShadowLight }> = ({ context: shadowLight }) => {
    const defaultGeneratorType = DefaultShadowGeneratorOptions[0].value;
    const defaultMapSize = MapSizeOptions[0].value;
    const [shadowGeneratorSettings, setShadowGeneratorSettings] = useState<Readonly<ShadowGeneratorSettings>>({ generatorType: defaultGeneratorType, mapSize: defaultMapSize });
    const shadowGeneratorOptions = shadowLight instanceof DirectionalLight ? DirectionalLightGeneratorOptions : DefaultShadowGeneratorOptions;
    const camera = useObservableState(() => shadowLight.getScene().activeCamera, shadowLight.getScene().onActiveCameraChanged);
    const shadowGenerator = shadowLight.getShadowGenerator(camera) ?? shadowLight.getShadowGenerators()?.values().next().value;
    const [hasShadowGenerator, setHasShadowGenerator] = useState(!!shadowGenerator);

    useEffect(() => {
        setHasShadowGenerator(!!shadowGenerator);
    }, [shadowGenerator]);

    return (
        <>
            {!hasShadowGenerator && (
                <>
                    <DropdownPropertyLine
                        key="Type"
                        label="Type"
                        options={shadowGeneratorOptions}
                        value={shadowGeneratorSettings.generatorType}
                        onChange={(value) => setShadowGeneratorSettings((prev) => ({ ...prev, generatorType: String(value) as ShadowGeneratorType }))}
                    />
                    <DropdownPropertyLine
                        key="Map Size"
                        label="Map Size"
                        options={MapSizeOptions}
                        value={shadowGeneratorSettings.mapSize}
                        onChange={(value) => setShadowGeneratorSettings((prev) => ({ ...prev, mapSize: Number(value) }))}
                    />
                    <ButtonLine
                        key="Create Generator"
                        label="Create Generator"
                        onClick={() => {
                            CreateShadowGenerator(shadowLight, shadowGeneratorSettings);
                            setHasShadowGenerator(true);
                        }}
                    />
                </>
            )}
        </>
    );
};
