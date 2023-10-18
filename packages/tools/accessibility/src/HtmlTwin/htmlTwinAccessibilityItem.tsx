import type { ReactElement } from "react";
import type { HTMLTwinItem } from "./htmlTwinItem";

function makeAccessibleItem(props: IHTMLTwinItemComponentProps) {
    const { description, isClickable, a11yItem } = props;
    if (description && a11yItem) {
        if (isClickable) {
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
                </div>
            );
        }
    } else {
        return null;
    }
}

export interface IHTMLTwinItemComponentProps {
    description: string | undefined;
    isClickable: boolean;
    children: ReactElement[];
    a11yItem: HTMLTwinItem;
}

export function HTMLTwinAccessibilityItem(props: IHTMLTwinItemComponentProps) {
    const accessibleItem = makeAccessibleItem(props);
    if (props.children.length > 0) {
        return (
            <div>
                {accessibleItem}
                <div>{props.children}</div>
            </div>
        );
    } else {
        return accessibleItem;
    }
}
