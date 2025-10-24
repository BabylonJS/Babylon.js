import type { FunctionComponent, PropsWithChildren } from "react";
import { Body1, Link as FluentLink } from "@fluentui/react-components";
import type { ImmutablePrimitiveProps } from "./primitive";

export type LinkProps = ImmutablePrimitiveProps<string> & {
    onLink?: () => void;
    url?: string;
    target?: string;
    rel?: string;
};
export const Link: FunctionComponent<PropsWithChildren<LinkProps>> = (props) => {
    return (
        <FluentLink inline target="_blank" rel="noopener noreferrer" onClick={() => props.onLink?.()} href={props.url} {...props}>
            {props.children}
            <Body1>{props.value}</Body1>
        </FluentLink>
    );
};
