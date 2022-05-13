import { Button, IButtonProps } from './Button';

import { Icon } from './Icon';
import resizeToFitIcon from "../imgs/resizeToFitIcon.svg";

export default {
    title: "Inputs/Button",
    component: Button
}

const Template = (args: IButtonProps) => <>
    <div>
    <h1>Icons</h1>
    <Button {...args} color="light"><Icon icon={resizeToFitIcon} color="dark"/></Button>
    <Button {...args} color="dark"><Icon icon={resizeToFitIcon} color="light"/></Button>
    </div>
    <div>
    <h1>Text</h1>
    <Button {...args} color="light">HELLO</Button>
    <Button {...args} color="dark">WORLD</Button>
    </div>
</>;

export const Default = Template.bind({});
Default.args = {
}
export const Wide = Template.bind({});
Wide.args = {
    size: "wide"
}
export const Small = Template.bind({});
Small.args = {
    size: "small"
}