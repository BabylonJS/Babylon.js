import type { FunctionComponent, PropsWithChildren } from "react";
import { Popover } from "shared-ui-components/fluent/primitives/popover";
import { Settings20Regular } from "@fluentui/react-icons";

/**
 * Settings popover component
 * @param props
 * @returns
 */
export const SettingsPopover: FunctionComponent<PropsWithChildren<{}>> = (props) => {
    return <Popover icon={Settings20Regular}> {props.children} </Popover>;
};
