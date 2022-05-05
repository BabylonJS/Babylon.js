import { Icon, IIconProps } from './Icon';

import resizeToFitIcon from "../imgs/resizeToFitIcon.svg";

export default {
    title: "Inputs/Icon",
    component: Icon
}

const Template = (args: IIconProps) => <Icon {...args} icon={resizeToFitIcon} />;

export const Light = Template.bind({});
Light.args = {
    color: "light"
}
export const Dark = Template.bind({});
Dark.args = {
    color: "dark"
}