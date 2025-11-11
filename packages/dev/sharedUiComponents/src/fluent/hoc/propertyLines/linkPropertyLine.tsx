import { PropertyLine } from "./propertyLine";
import { Link } from "../../primitives/link";
import type { LinkProps } from "../../primitives/link";
import type { PropertyLineProps } from "./propertyLine";
import type { FunctionComponent } from "react";

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
