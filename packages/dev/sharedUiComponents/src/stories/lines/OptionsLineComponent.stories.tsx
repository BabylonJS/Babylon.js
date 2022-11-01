import { useState } from "react";
import { OptionsLineComponent } from "../../components/lines/OptionsLineComponent";
import type { ComponentStory } from "@storybook/react";

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
            />
            <div>
                <h3>Selected option value:</h3>
                <div>{selectedOptionValue}</div>
            </div>
        </div>
    );
};

export const Default: ComponentStory<typeof RenderComponent> = {
    render: (args: any) => {
        return <RenderComponent {...args} />;
    },
    args: {
        initialOptions: [
            { label: "Option 1", value: "option1" },
            { label: "Option 2", value: "option2" },
            { label: "Option 3", value: "option3" },
        ],
        initialSelectedOptionValue: "option1",
    },
};

export const WithCustomOptions: ComponentStory<typeof RenderComponent> = {
    render: Default.render,
    args: { ...Default.args, customAdd: true, addOptionPlaceholder: "This is a placeholder" },
};
