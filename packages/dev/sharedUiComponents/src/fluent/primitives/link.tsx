import type { FunctionComponent, PropsWithChildren } from "react";
import { Link as FluentLink } from "@fluentui/react-components";

type LinkProps = {
    href: string;
};
export const Link: FunctionComponent<PropsWithChildren<LinkProps>> = (props) => {
    return <FluentLink {...props} target="_blank" />;
};
