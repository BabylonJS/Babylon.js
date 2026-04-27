import { PropertyLine, type PropertyLineProps } from "./propertyLine";
import { Link, type LinkProps } from "../../primitives/link";
import { type FunctionComponent } from "react";

/**
 * Wraps a link in a property line
 * @param props - PropertyLineProps and LinkProps
 * @returns property-line wrapped link
 */
export const LinkPropertyLine: FunctionComponent<PropertyLineProps<string> & LinkProps> = (props) => {
    LinkPropertyLine.displayName = "LinkPropertyLine";
    return (
        <PropertyLine {...props}>
            <Link {...props} />
        </PropertyLine>
    );
};
