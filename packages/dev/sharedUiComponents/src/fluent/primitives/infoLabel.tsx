import type { FunctionComponent } from "react";
import { InfoLabel as FluentInfoLabel } from "@fluentui/react-components";

export type InfoLabelProps = {
    htmlFor: string; // required ID of the element whose label we are applying
    info?: JSX.Element;
    label: string;
};
export type InfoLabelParentProps = Omit<InfoLabelProps, "htmlFor">;

/**
 * Renders a label with an optional popup containing more info
 * @param props
 * @returns
 */
export const InfoLabel: FunctionComponent<InfoLabelProps> = (props) => {
    return (
        <FluentInfoLabel htmlFor={props.htmlFor} info={props.info}>
            {props.label}
        </FluentInfoLabel>
    );
};
