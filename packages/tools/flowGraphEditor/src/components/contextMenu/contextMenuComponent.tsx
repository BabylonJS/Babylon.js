import * as React from "react";
import "./contextMenu.scss";

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

/**
 * Generic right-click context menu shown as a fixed overlay.
 */
export class ContextMenuComponent extends React.Component<IContextMenuComponentProps> {
    private _menuRef = React.createRef<HTMLDivElement>();

    /** @internal */
    override componentDidMount() {
        this._clampToViewport();
        // Close on Escape
        this._onKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                this.props.onClose();
            }
        };
        document.addEventListener("keydown", this._onKeyDown);
    }

    /** @internal */
    override componentDidUpdate() {
        this._clampToViewport();
    }

    /** @internal */
    override componentWillUnmount() {
        if (this._onKeyDown) {
            document.removeEventListener("keydown", this._onKeyDown);
        }
    }

    private _onKeyDown: ((e: KeyboardEvent) => void) | null = null;

    private _clampToViewport() {
        const el = this._menuRef.current;
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
    }

    /** @internal */
    override render() {
        return (
            <div className="fge-context-menu-overlay" onPointerDown={() => this.props.onClose()} onContextMenu={(e) => e.preventDefault()}>
                <div ref={this._menuRef} className="fge-context-menu" role="menu" style={{ left: this.props.x, top: this.props.y }} onPointerDown={(e) => e.stopPropagation()}>
                    {this.props.items.map((entry, idx) => {
                        if (IsSeparator(entry)) {
                            return <div key={`sep-${idx}`} className="fge-ctx-separator" role="separator" />;
                        }
                        const item = entry;
                        return (
                            <div
                                key={`item-${idx}`}
                                className={`fge-ctx-item${item.disabled ? " disabled" : ""}`}
                                role="menuitem"
                                tabIndex={item.disabled ? -1 : 0}
                                aria-label={item.ariaLabel ?? item.label}
                                aria-disabled={item.disabled}
                                onClick={() => {
                                    if (!item.disabled) {
                                        item.action();
                                        this.props.onClose();
                                    }
                                }}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter" || e.key === " ") {
                                        e.preventDefault();
                                        if (!item.disabled) {
                                            item.action();
                                            this.props.onClose();
                                        }
                                    }
                                }}
                            >
                                <span>{item.label}</span>
                                {item.shortcut && <span className="fge-ctx-shortcut">{item.shortcut}</span>}
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    }
}
