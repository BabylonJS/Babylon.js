import type { Nullable } from "core/index";

import type { FunctionComponent, ReactElement } from "react";

import { Tooltip as FluentTooltip } from "@fluentui/react-components";

export type TooltipProps = { content?: Nullable<string>; children: ReactElement };

export const Tooltip: FunctionComponent<TooltipProps> = (props) => {
    const { content, children } = props;

    if (!content) {
        return children;
    }

    return (
        <FluentTooltip relationship="description" content={content}>
            {children}
        </FluentTooltip>
    );
};
