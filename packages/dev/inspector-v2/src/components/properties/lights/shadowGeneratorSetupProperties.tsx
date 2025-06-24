// eslint-disable-next-line import/no-internal-modules
import { DirectionalLight, ShadowGenerator, CascadedShadowGenerator, type ShadowLight } from "core/index";
import type { FunctionComponent } from "react";

import { Dropdown, type DropdownOption } from "shared-ui-components/fluent/primitives/dropdown";
import { PropertyLine } from "shared-ui-components/fluent/hoc/propertyLine";
import { ButtonLine } from "shared-ui-components/fluent/hoc/buttonLine";

const DefaultShadowGeneratorOptions: DropdownOption[] = [{ label: "Shadow Generator", value: "0" }];

const DirectionalLightGeneratorOptions: DropdownOption[] = [
    { label: "Shadow Generator", value: "0" },
    { label: "Cascaded Shadow Generator", value: "1" },
];

const MapSizeOptions: DropdownOption[] = [
    { label: "4096x4096", value: "4096" },
    { label: "2048x2048", value: "2048" },
    { label: "1024x1024", value: "1024" },
    { label: "512x512", value: "512" },
    { label: "256x256", value: "256" },
];

type ShadowGeneratorSettings = {
    generatorType: string; // Type of shadow generator
    mapSize: string; // Size of the shadow map
};

function CreateShadowGenerator(shadowLight: ShadowLight, settings: ShadowGeneratorSettings): void {
    const light = shadowLight;
    const scene = light.getScene();
    const internals = settings;
    const generatorType = Number(internals.generatorType);
    const mapSize = Number(internals.mapSize);
    const generator = generatorType === 0 ? new ShadowGenerator(mapSize, light) : new CascadedShadowGenerator(mapSize, light as DirectionalLight);

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
    const shadowGeneratorSetting: ShadowGeneratorSettings = { generatorType: "0", mapSize: "4096" };
    const shadowGeneratorOptions = shadowLight instanceof DirectionalLight ? DirectionalLightGeneratorOptions : DefaultShadowGeneratorOptions;
    return (
        <>
            <PropertyLine label="Type">
                <Dropdown options={shadowGeneratorOptions} onSelect={(value: string) => (shadowGeneratorSetting.generatorType = value)} defaultValue={shadowGeneratorOptions[0]} />
            </PropertyLine>
            <PropertyLine label="Map Size">
                <Dropdown options={MapSizeOptions} onSelect={(value: string) => (shadowGeneratorSetting.mapSize = value)} defaultValue={MapSizeOptions[0]} />
            </PropertyLine>
            <ButtonLine
                label="Create Generator"
                onClick={() => {
                    if (!shadowLight.getShadowGenerator()) {
                        CreateShadowGenerator(shadowLight, shadowGeneratorSetting);
                        return;
                    }
                }}
            />
        </>
    );
};
