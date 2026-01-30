import type { Nullable } from "core/index";

import type { ReactElement, Ref } from "react";
import { forwardRef, cloneElement, isValidElement } from "react";

import { Tooltip as FluentTooltip } from "@fluentui/react-components";

export type TooltipProps = { content?: Nullable<string>; children: ReactElement };

export const Tooltip = forwardRef<HTMLElement, TooltipProps>((props, ref) => {
    const { content, children } = props;

    // Clone children to pass ref through
    const childWithRef = isValidElement(children) ? cloneElement(children, { ref } as { ref: Ref<HTMLElement> }) : children;

    if (!content) {
        return childWithRef;
    }

    return (
        <FluentTooltip relationship="description" content={content}>
            {childWithRef}
        </FluentTooltip>
    );
});

Tooltip.displayName = "Tooltip";
