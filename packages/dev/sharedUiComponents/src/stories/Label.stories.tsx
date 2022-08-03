import type { LabelProps } from "../components/Label";
import { Label } from "../components/Label";
import { Toggle } from "../components/Toggle";

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
