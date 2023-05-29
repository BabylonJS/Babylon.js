import type { ToggleProps } from "../components/Toggle";
import { Toggle } from "../components/Toggle";

export default {
    title: "Inputs/Toggle",
    component: Toggle,
};

const Template = (args: ToggleProps) => <Toggle {...args} onToggle={() => {}} />;

export const Default = Template.bind({});
Default.args = {
    toggled: "off",
    padded: false,
};
export const Padded = Template.bind({});
Padded.args = {
    toggled: "off",
    padded: true,
};
