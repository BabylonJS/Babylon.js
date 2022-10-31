import { useState } from "react";
import { OptionsLineComponent } from "../../components/lines/OptionsLineComponent";

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
        <div>
            <OptionsLineComponent
                label="Options:"
                options={options}
                icon=""
                iconLabel=""
                onOptionSelected={onOptionSelected}
                selectedOptionValue={selectedOptionValue}
                onOptionAdded={args.customAdd ? onOptionAdded : undefined}
                addOptionText={args.addOptionText} // Text to display when adding a new option
                addOptionPlaceholder={args.addOptionPlaceholder} // Placeholder text to display when adding a new option
            />
            <div>
                <h3>Selected option value:</h3>
                <div>{selectedOptionValue}</div>
            </div>
        </div>
    );
};

export const Default = {
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

export const WithCustomOptions = {
    render: Default.render,
    args: { ...Default.args, customAdd: true, addOptionText: "Customizable text shown when adding a new option", addOptionPlaceholder: "This is a placeholder" },
};
