import { useState } from "react";
import { OptionsLineComponent } from "../../components/lines/OptionsLineComponent";
import type { StoryObj } from "@storybook/react";

export default { component: OptionsLineComponent };

const RenderComponent = (args: any) => {
    const [options, setOptions] = useState(args.initialOptions);
    const [selectedOptionValue, setSelectedOptionValue] = useState(args.initialSelectedOptionValue);

    const onOptionSelected = (selectedOptionValue: string) => {
        setSelectedOptionValue(selectedOptionValue);
    };

    const onOptionAdded = (newOption: any) => {
        setOptions([...options, newOption]);
    };

    return (
        <div style={{ width: "200px" }}>
            <OptionsLineComponent
                options={options}
                onOptionSelected={onOptionSelected}
                selectedOptionValue={selectedOptionValue}
                onOptionAdded={args.customAdd ? onOptionAdded : undefined}
                addOptionPlaceholder={args.addOptionPlaceholder} // Placeholder text to display when adding a new option
                validateNewOptionValue={args.validateNewOptionValue} // Optional function that can be used to validate the value of a new option
            />
            <div>
                <h3>Selected option value:</h3>
                <div>{selectedOptionValue}</div>
            </div>
        </div>
    );
};

export const Default: StoryObj<typeof RenderComponent> = {
    render: (args: any) => {
        return <RenderComponent {...args} />;
    },
    args: {
        initialOptions: [
            { label: "Option 1", value: "option1", id: "1" },
            { label: "Option 2", value: "option2", id: "2" },
            { label: "Option 3", value: "option3", id: "3" },
        ],
        initialSelectedOptionValue: "option1",
    },
};

export const WithCustomOptions: StoryObj<typeof RenderComponent> = {
    render: Default.render,
    args: { ...Default.args, customAdd: true, addOptionPlaceholder: "This is a placeholder" },
};

export const WithValidation: StoryObj<typeof RenderComponent> = {
    render: Default.render,
    args: { ...Default.args, customAdd: true, addOptionPlaceholder: "Valid: length > 3", validateNewOptionValue: (value: string) => value.length > 3 },
};
