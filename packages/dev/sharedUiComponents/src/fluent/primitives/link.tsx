import type { FunctionComponent, PropsWithChildren } from "react";
import { Body1, Link as FluentLink } from "@fluentui/react-components";
import type { ImmutablePrimitiveProps } from "./primitive";

export type LinkProps = ImmutablePrimitiveProps<string> & {
    /**
     * Used if you want to handle the link click yourself
     */
    onLink?: () => void;
    /**
     * The URL the link points to
     */
    url?: string;
    /**
     * Defines whether to open the link in current tab or new tab. Default is new
     */
    target?: "current" | "new";
};

export const Link: FunctionComponent<PropsWithChildren<LinkProps>> = (props) => {
    const { target, url, onLink, ...rest } = props;
    return (
        <FluentLink inline target={target === "current" ? "_self" : "_blank"} rel="noopener noreferrer" href={url} onClick={onLink ?? undefined} {...rest}>
            {props.children}
            <Body1>{props.value}</Body1>
        </FluentLink>
    );
};
