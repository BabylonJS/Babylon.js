import { LabelProps, Label } from "./Label";
import { Toggle } from "./Toggle";

export default {
    title: "Layout/Label",
    component: Label,
};

const Template = (args: LabelProps) => (
    <Label {...args} text="Responsive:">
        <Toggle toggled="off" color={args.color} />
    </Label>
);

export const Default = Template.bind({});
Default.args = {};
