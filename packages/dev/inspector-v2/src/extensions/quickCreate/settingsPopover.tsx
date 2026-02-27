import type { FunctionComponent, PropsWithChildren } from "react";
import { Popover } from "shared-ui-components/fluent/primitives/popover";
import { SettingsRegular } from "@fluentui/react-icons";

type SettingsPopoverProps = {
    /** Controlled open state */
    open?: boolean;
    /** Callback when open state changes */
    onOpenChange?: (open: boolean) => void;
};

/**
 * Settings popover component
 * @param props
 * @returns
 */
export const SettingsPopover: FunctionComponent<PropsWithChildren<SettingsPopoverProps>> = (props) => {
    return (
        <Popover icon={SettingsRegular} open={props.open} onOpenChange={props.onOpenChange}>
            {props.children}
        </Popover>
    );
};
