import type { ReactElement } from "react";
import type { HTMLTwinItem } from "./htmlTwinItem";
export interface IHTMLTwinItemComponentProps {
    description: string | undefined;
    children: ReactElement[];
    a11yItem: HTMLTwinItem;
}

export function HTMLTwinAccessibilityItem(props: IHTMLTwinItemComponentProps) {
    const { description, a11yItem, children } = props;
    if (description && a11yItem) {
        if (a11yItem.isActionable) {
            return (
                <button
                    tabIndex={a11yItem.isFocusable ? 0 : -1}
                    onClick={() => a11yItem.triggerEvent("click")}
                    onContextMenu={() => a11yItem.triggerEvent("contextmenu")}
                    onFocus={() => a11yItem.focus()}
                    onBlur={() => a11yItem.blur()}
                    {...a11yItem.entity.accessibilityTag?.aria}
                >
                    {description}
                    {children}
                </button>
            );
        } else {
            return (
                <div
                    tabIndex={a11yItem.isFocusable ? 0 : -1}
                    onClick={() => a11yItem.triggerEvent("click")}
                    onContextMenu={() => a11yItem.triggerEvent("contextmenu")}
                    onFocus={() => a11yItem.focus()}
                    onBlur={() => a11yItem.blur()}
                    {...a11yItem.entity.accessibilityTag?.aria}
                >
                    {description}
                    {children}
                </div>
            );
        }
    } else {
        return <>{children}</>;
    }
}
