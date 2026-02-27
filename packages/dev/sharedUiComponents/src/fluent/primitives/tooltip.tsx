import type { Nullable } from "core/index";

import type { ReactElement } from "react";
import { forwardRef } from "react";

import { Tooltip as FluentTooltip } from "@fluentui/react-components";

export type TooltipProps = { content?: Nullable<string>; children: ReactElement };

// forwardRef wrapper to avoid "function components cannot be given refs" warning
// FluentTooltip handles ref forwarding to children internally via applyTriggerPropsToChildren
export const Tooltip = forwardRef<HTMLElement, TooltipProps>((props, _ref) => {
    const { content, children } = props;

    if (!content) {
        return children;
    }

    return (
        <FluentTooltip relationship="description" content={content}>
            {children}
        </FluentTooltip>
    );
});

Tooltip.displayName = "Tooltip";
