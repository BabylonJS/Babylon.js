// eslint-disable-next-line import/no-internal-modules
import { ShadowGenerator, type ShadowLight } from "core/index";
import type { FunctionComponent } from "react";

import { Dropdown, type DropdownOption } from "shared-ui-components/fluent/primitives/dropdown";
import { PropertyLine } from "shared-ui-components/fluent/hoc/propertyLine";
import { ButtonLine } from "shared-ui-components/fluent/hoc/buttonLine";

const ShadowGeneratorOptions: DropdownOption[] = [{ label: "Shadow Generator", value: "Shadow Generator" }];

const MapSizeOptions: DropdownOption[] = [
    { label: "4096x4096", value: "4096" },
    { label: "2048x2048", value: "2048" },
    { label: "1024x1024", value: "1024" },
    { label: "512x512", value: "512" },
    { label: "256x256", value: "256" },
];

export const ShadowGeneratorSetupProperties: FunctionComponent<{ context: ShadowLight }> = ({ context: shadowLight }) => {
    const shadowGeneratorSetting: any = { type: "Shadow Generator", mapSize: "4096" }; // Placeholder for shadow generator settings logic
    return (
        <>
            <PropertyLine label="Type">
                <Dropdown options={ShadowGeneratorOptions} onSelect={(value) => (shadowGeneratorSetting.type = value)} defaultValue={ShadowGeneratorOptions[0]} />
            </PropertyLine>
            <PropertyLine label="Map Size">
                <Dropdown options={MapSizeOptions} onSelect={(value) => (shadowGeneratorSetting.mapSize = value)} defaultValue={MapSizeOptions[0]} />
            </PropertyLine>
            <ButtonLine
                label="Create Generator"
                onClick={() => {
                    if (!shadowLight.getShadowGenerator()) {
                        const shadowGenerator = new ShadowGenerator(Number(shadowGeneratorSetting.mapSize), shadowLight);
                        return;
                    }
                }}
            />
        </>
    );
};
