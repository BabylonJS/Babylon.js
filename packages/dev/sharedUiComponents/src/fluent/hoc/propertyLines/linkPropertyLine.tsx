import { Body1 } from "@fluentui/react-components";
import { PropertyLine } from "./propertyLine";
import { Link } from "../../primitives/link";
import type { ImmutablePrimitiveProps } from "../../primitives/primitive";
import type { PropertyLineProps } from "./propertyLine";
import type { FunctionComponent } from "react";

type LinkProps = ImmutablePrimitiveProps<string> & {
    onLink?: () => void;
    url?: string;
};

/**
 * Wraps a link in a property line
 * @param props - PropertyLineProps and LinkProps
 * @returns property-line wrapped link
 */
export const LinkPropertyLine: FunctionComponent<PropertyLineProps<string> & LinkProps> = (props) => {
    return (
        <PropertyLine {...props}>
            <Link inline appearance="subtle" onClick={() => props.onLink?.()} href={props.url} title={props.title}>
                <Body1>{props.value}</Body1>
            </Link>
        </PropertyLine>
    );
};
