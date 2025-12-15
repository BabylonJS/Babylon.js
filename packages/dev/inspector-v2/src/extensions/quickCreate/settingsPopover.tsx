import type { FunctionComponent, PropsWithChildren } from "react";
import { Popover } from "shared-ui-components/fluent/primitives/popover";
import { SettingsRegular } from "@fluentui/react-icons";

/**
 * Settings popover component
 * @param props
 * @returns
 */
export const SettingsPopover: FunctionComponent<PropsWithChildren<{}>> = (props) => {
    return <Popover icon={SettingsRegular}> {props.children} </Popover>;
};
