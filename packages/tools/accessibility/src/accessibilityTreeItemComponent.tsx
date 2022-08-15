import * as React from "react";
import type { AccessibilityItem } from "./accessibilityItem";

interface IAccessibilityTreeItemComponentProps {
    a11yItem: AccessibilityItem;
    level: number;
}

export class AccessibilityTreeItemComponent extends React.Component<IAccessibilityTreeItemComponentProps> {
    constructor(props: IAccessibilityTreeItemComponentProps) {
        super(props);
    }

    render() {
        const item = this.props.a11yItem;

        if (item.children.length === 0) {
            return this._renderLeafNode(item);
        } else {
            return this._renderParentNode(item, this.props.level);
        }
    }

    private _renderLeafNode(a11yItem: AccessibilityItem): JSX.Element {
        if (a11yItem.isActionable) {
            return (
                <button
                    onClick={() => {
                        a11yItem.triggerEvent("click");
                    }}
                    onContextMenu={() => {
                        a11yItem.triggerEvent("contextmenu");
                    }}
                    tabIndex={a11yItem.isFocusable ? 0 : -1}
                    onFocus={() => {
                        a11yItem.focus();
                    }}
                    onBlur={() => {
                        a11yItem.blur();
                    }}
                    role={a11yItem.entity.accessibilityTag?.role}
                    {...a11yItem.entity.accessibilityTag?.aria}
                >
                    {a11yItem.description}
                </button>
            );
        } else {
            return (
                <div
                    tabIndex={a11yItem.isFocusable ? 0 : -1}
                    onFocus={() => {
                        a11yItem.focus();
                    }}
                    onBlur={() => {
                        a11yItem.blur();
                    }}
                    role={a11yItem.entity.accessibilityTag?.role}
                    {...a11yItem.entity.accessibilityTag?.aria}
                >
                    {a11yItem.description}
                </div>
            );
        }
    }

    private _renderParentNode(a11yItem: AccessibilityItem, level: number): JSX.Element {
        return (
            <div>
                {!!a11yItem.description && (
                    <div
                        role={a11yItem.entity.accessibilityTag?.role ?? "heading"}
                        aria-level={level}
                        tabIndex={a11yItem.isFocusable ? 0 : -1}
                        onFocus={() => {
                            a11yItem.focus();
                        }}
                        onBlur={() => {
                            a11yItem.blur();
                        }}
                        {...a11yItem.entity.accessibilityTag?.aria}
                    >
                        {a11yItem.description}
                    </div>
                )}
                {this._renderChildren(a11yItem.children, Math.min(level + 1, 6))}
            </div>
        );
    }

    private _renderChildren(children: AccessibilityItem[], level: number): JSX.Element[] {
        return children.map((child) => {
            return (
                <AccessibilityTreeItemComponent
                    a11yItem={child}
                    level={level}
                    key={child.entity.uniqueId !== undefined && child.entity.uniqueId !== null ? child.entity.uniqueId : child.entity.name}
                />
            );
        });
    }
}
