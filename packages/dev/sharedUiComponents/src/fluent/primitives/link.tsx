import type { FunctionComponent, PropsWithChildren } from "react";
import { Link as FluentLink } from "@fluentui/react-components";

type LinkProps = {
    href: string;
    target?: string;
    rel?: string;
};
export const Link: FunctionComponent<PropsWithChildren<LinkProps>> = (props) => {
    return <FluentLink target={"_blank"} rel={"noopener noreferrer"} {...props} />;
};
