import type { IconProps } from "../components/Icon";
import { Icon } from "../components/Icon";

import resizeToFitIcon from "../imgs/resizeToFitIcon.svg";

export default {
    title: "Layout/Icon",
    component: Icon,
};

const Template = (args: IconProps) => <Icon {...args} icon={resizeToFitIcon} />;

export const Light = Template.bind({});
Light.args = {
    color: "light",
};
export const Dark = Template.bind({});
Dark.args = {
    color: "dark",
};
