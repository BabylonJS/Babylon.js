import { type Nullable } from "core/index";

import { type ReactElement, forwardRef } from "react";

import { Tooltip as FluentTooltip, type TooltipProps as FluentTooltipProps } from "@fluentui/react-components";

/**
 * Props for the Tooltip primitive.
 */
export type TooltipProps = {
    /** The tooltip content. If null/empty, the tooltip is not rendered. */
    content?: Nullable<string | ReactElement>;
    /** Optional positioning passed through to the underlying FluentTooltip. */
    positioning?: FluentTooltipProps["positioning"];
    /** The element that the tooltip is attached to. */
    children: ReactElement;
};

// forwardRef wrapper to avoid "function components cannot be given refs" warning
// FluentTooltip handles ref forwarding to children internally via applyTriggerPropsToChildren
export const Tooltip = forwardRef<HTMLElement, TooltipProps>((props, _ref) => {
    const { content, positioning, children } = props;

    if (!content) {
        return children;
    }

    return (
        <FluentTooltip relationship="description" content={content} positioning={positioning}>
            {children}
        </FluentTooltip>
    );
});

Tooltip.displayName = "Tooltip";
