import type { Nullable } from "core/index";

import type { ReactElement, Ref } from "react";
import { forwardRef, cloneElement, isValidElement } from "react";

import { Tooltip as FluentTooltip } from "@fluentui/react-components";

export type TooltipProps = { content?: Nullable<string>; children: ReactElement };

export const Tooltip = forwardRef<HTMLElement, TooltipProps>((props, ref) => {
    const { content, children } = props;

    // When there's no tooltip content, just render children with forwarded ref
    if (!content) {
        return ref && isValidElement(children) ? cloneElement(children, { ref } as { ref: Ref<HTMLElement> }) : children;
    }

    // FluentTooltip handles its own ref for positioning - don't interfere with it
    return (
        <FluentTooltip relationship="description" content={content}>
            {children}
        </FluentTooltip>
    );
});

Tooltip.displayName = "Tooltip";
