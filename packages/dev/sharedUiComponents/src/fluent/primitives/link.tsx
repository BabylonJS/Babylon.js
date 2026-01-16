import type { PropsWithChildren } from "react";

import type { ImmutablePrimitiveProps } from "./primitive";

import { forwardRef } from "react";
import { Body1, Caption1, Link as FluentLink } from "@fluentui/react-components";

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

    /**Force link size */
    size?: "small" | "medium";
};

export const Link = forwardRef<HTMLAnchorElement, PropsWithChildren<LinkProps>>((props, ref) => {
    const { target, url, onLink, size, ...rest } = props;
    // eslint-disable-next-line @typescript-eslint/naming-convention
    const TextComponent = size === "small" ? Caption1 : Body1;

    return (
        <FluentLink ref={ref} inline target={target === "current" ? "_self" : "_blank"} rel="noopener noreferrer" href={url} onClick={onLink ?? undefined} {...rest}>
            {props.children}
            <TextComponent>{props.value}</TextComponent>
        </FluentLink>
    );
});
Link.displayName = "Link";
