import { Body1 } from "@fluentui/react-components";
import { PropertyLine } from "./propertyLine";
import { Link } from "../primitives/link";
import type { PropertyLineProps } from "./propertyLine";
import type { FunctionComponent } from "react";

type LinkProps = {
    value: string;
    tooltip?: string;
    onLink?: () => void;
    url?: string;
};

/**
 * Wraps a link in a property line
 * @param props - PropertyLineProps and LinkProps
 * @returns property-line wrapped link
 */
export const LinkPropertyLine: FunctionComponent<PropertyLineProps & LinkProps> = (props) => {
    return (
        <PropertyLine {...props}>
            <Link inline appearance="subtle" onClick={() => props.onLink?.()} href={props.url} title={props.tooltip}>
                <Body1>{props.value}</Body1>
            </Link>
        </PropertyLine>
    );
};
