import type { ButtonProps } from "../components/Button";
import { Button } from "../components/Button";

import { Icon } from "../components/Icon";
import resizeToFitIcon from "../imgs/resizeToFitIcon.svg";

export default {
    title: "Inputs/Button",
    component: Button,
};

const Template = (args: ButtonProps) => (
    <>
        <div>
            <h1>Icons</h1>
            <Button {...args} color="light" title="Foo">
                <Icon icon={resizeToFitIcon} color="dark" />
            </Button>
            <Button {...args} color="dark" title="Bar">
                <Icon icon={resizeToFitIcon} color="light" />
            </Button>
        </div>
        <div>
            <h1>Text</h1>
            <Button {...args} color="light" title="Foo">
                HELLO
            </Button>
            <Button {...args} color="dark" title="Bar">
                WORLD
            </Button>
        </div>
    </>
);

export const Default = Template.bind({});
Default.args = {};
export const Wide = Template.bind({});
Wide.args = {
    size: "wide",
};
export const Small = Template.bind({});
Small.args = {
    size: "small",
};
