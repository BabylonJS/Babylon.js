import type { MessageDialogProps } from "../components/MessageDialog";
import { MessageDialog } from "../components/MessageDialog";

export default {
    title: "Layout/MessageDialog",
    component: MessageDialog,
};

const Template = (args: MessageDialogProps) => {
    return <MessageDialog {...args} />;
};

export const NoError = Template.bind({});
NoError.args = {
    message: "No error",
    isError: false,
};

export const Error = Template.bind({});
Error.args = {
    message: "Error",
    isError: true,
};
