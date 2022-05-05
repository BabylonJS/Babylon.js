import { IToggleProps, Toggle } from './Toggle';

export default {
    title: "Inputs/Toggle",
    component: Toggle
}

const Template = (args: IToggleProps) => <Toggle {...args} onToggle={() => {}} />;

export const Default = Template.bind({});
Default.args = {
    toggled: "off",
    padded: false
}
export const Padded = Template.bind({});
Padded.args = {
    toggled: "off",
    padded: true
}