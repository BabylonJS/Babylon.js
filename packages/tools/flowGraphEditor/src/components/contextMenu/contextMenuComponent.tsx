import { type FunctionComponent, useEffect, useLayoutEffect, useRef } from "react";

import { makeStyles, mergeClasses, tokens } from "@fluentui/react-components";

/**
 * Describes one item in a context menu.
 */
export interface IContextMenuItem {
    /** Display label */
    label: string;
    /** Callback when clicked */
    action: () => void;
    /** Keyboard shortcut hint (display only) */
    shortcut?: string;
    /** Whether the item is disabled */
    disabled?: boolean;
    /** Accessible description */
    ariaLabel?: string;
}

/**
 * A separator entry in a context menu.
 */
export interface IContextMenuSeparator {
    /** Marker to distinguish separator from action items */
    isSeparator: true;
}

export type ContextMenuEntry = IContextMenuItem | IContextMenuSeparator;

function IsSeparator(entry: ContextMenuEntry): entry is IContextMenuSeparator {
    return "isSeparator" in entry && entry.isSeparator === true;
}

interface IContextMenuComponentProps {
    /** Screen X position */
    x: number;
    /** Screen Y position */
    y: number;
    /** Menu entries */
    items: ContextMenuEntry[];
    /** Called when the menu should close */
    onClose: () => void;
}

const useStyles = makeStyles({
    overlay: {
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        zIndex: 10000,
    },
    menu: {
        position: "fixed",
        zIndex: 10001,
        background: tokens.colorNeutralBackground1,
        border: `1px solid ${tokens.colorNeutralStroke2}`,
        borderRadius: tokens.borderRadiusMedium,
        boxShadow: tokens.shadow16,
        minWidth: "180px",
        padding: `${tokens.spacingVerticalXS} 0`,
        color: tokens.colorNeutralForeground1,
        fontSize: tokens.fontSizeBase300,
    },
    item: {
        display: "flex",
        alignItems: "center",
        gap: tokens.spacingHorizontalS,
        padding: `${tokens.spacingVerticalSNudge} ${tokens.spacingHorizontalL}`,
        cursor: "pointer",
        whiteSpace: "nowrap",
        userSelect: "none",
        ":hover": {
            background: tokens.colorNeutralBackground1Hover,
            color: tokens.colorNeutralForeground1Hover,
        },
    },
    itemDisabled: {
        opacity: 0.35,
        cursor: "not-allowed",
        ":hover": {
            background: "transparent",
            color: tokens.colorNeutralForeground1,
        },
    },
    shortcut: {
        marginLeft: "auto",
        fontSize: tokens.fontSizeBase200,
        opacity: 0.6,
    },
    separator: {
        height: "1px",
        background: tokens.colorNeutralStroke2,
        margin: `${tokens.spacingVerticalXS} 0`,
    },
});

/**
 * Generic right-click context menu shown as a fixed overlay.
 * @returns The rendered context menu.
 */
export const ContextMenuComponent: FunctionComponent<IContextMenuComponentProps> = ({ x, y, items, onClose }) => {
    const classes = useStyles();
    const menuRef = useRef<HTMLDivElement>(null);

    // Close on Escape.
    useEffect(() => {
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                onClose();
            }
        };
        document.addEventListener("keydown", onKeyDown);
        return () => document.removeEventListener("keydown", onKeyDown);
    }, [onClose]);

    // Clamp the menu inside the viewport once it has been measured.
    useLayoutEffect(() => {
        const el = menuRef.current;
        if (!el) {
            return;
        }
        const rect = el.getBoundingClientRect();
        const vw = window.innerWidth;
        const vh = window.innerHeight;
        if (rect.right > vw) {
            el.style.left = `${Math.max(0, vw - rect.width - 4)}px`;
        }
        if (rect.bottom > vh) {
            el.style.top = `${Math.max(0, vh - rect.height - 4)}px`;
        }
    }, [x, y, items]);

    return (
        <div className={classes.overlay} onPointerDown={onClose} onContextMenu={(e) => e.preventDefault()}>
            <div ref={menuRef} className={classes.menu} role="menu" style={{ left: x, top: y }} onPointerDown={(e) => e.stopPropagation()}>
                {items.map((entry, idx) => {
                    if (IsSeparator(entry)) {
                        return <div key={`sep-${idx}`} className={classes.separator} role="separator" />;
                    }
                    const item = entry;
                    return (
                        <div
                            key={`item-${idx}`}
                            className={mergeClasses(classes.item, item.disabled && classes.itemDisabled)}
                            role="menuitem"
                            tabIndex={item.disabled ? -1 : 0}
                            aria-label={item.ariaLabel ?? item.label}
                            aria-disabled={item.disabled}
                            onClick={() => {
                                if (!item.disabled) {
                                    item.action();
                                    onClose();
                                }
                            }}
                            onKeyDown={(e) => {
                                if (e.key === "Enter" || e.key === " ") {
                                    e.preventDefault();
                                    if (!item.disabled) {
                                        item.action();
                                        onClose();
                                    }
                                }
                            }}
                        >
                            <span>{item.label}</span>
                            {item.shortcut && <span className={classes.shortcut}>{item.shortcut}</span>}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
