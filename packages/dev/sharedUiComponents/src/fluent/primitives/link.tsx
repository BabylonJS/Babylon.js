import type { PropsWithChildren } from "react";

import type { ImmutablePrimitiveProps } from "./primitive";

import { forwardRef } from "react";
import { Body1, Link as FluentLink } from "@fluentui/react-components";

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

export const Link = forwardRef<HTMLAnchorElement, PropsWithChildren<LinkProps>>((props, ref) => {
    const { target, url, onLink, ...rest } = props;
    return (
        <FluentLink ref={ref} inline target={target === "current" ? "_self" : "_blank"} rel="noopener noreferrer" href={url} onClick={onLink ?? undefined} {...rest}>
            {props.children}
            <Body1 wrap={false} truncate>
                {props.value}
            </Body1>
        </FluentLink>
    );
});
Link.displayName = "Link";
