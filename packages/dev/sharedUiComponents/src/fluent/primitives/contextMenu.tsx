import type { ReactElement, ReactNode } from "react";
import { forwardRef, useState } from "react";
import { Menu, MenuTrigger, MenuPopover, MenuList, MenuItem, MenuDivider, MenuGroup, MenuGroupHeader, makeStyles, tokens } from "@fluentui/react-components";
import type { MenuProps as FluentMenuProps } from "@fluentui/react-components";
import type { FluentIcon } from "@fluentui/react-icons";
import { Button } from "shared-ui-components/fluent/primitives/button";
import type { BasePrimitiveProps } from "./primitive";

const useStyles = makeStyles({
    menuPopover: {
        minWidth: "160px",
    },
    menuItem: {
        cursor: "pointer",
    },
    menuItemIcon: {
        color: tokens.colorNeutralForeground2,
    },
});

/**
 * Represents a single menu item in the context menu.
 */
export type ContextMenuItemProps = {
    /**
     * Unique key for the menu item.
     */
    key: string;
    /**
     * The text label displayed for the menu item.
     */
    label: string;
    /**
     * Optional icon to display alongside the menu item.
     */
    icon?: FluentIcon;
    /**
     * Called when the menu item is clicked.
     */
    onClick?: () => void;
    /**
     * Whether the menu item is disabled.
     */
    disabled?: boolean;
    /**
     * Optional secondary text displayed alongside the label.
     */
    secondaryContent?: string;
};

/**
 * Represents a divider in the context menu.
 */
export type ContextMenuDividerProps = {
    /**
     * Unique key for the divider.
     */
    key: string;
    /**
     * Indicates this is a divider item.
     */
    type: "divider";
};

/**
 * Represents a group of menu items with an optional header.
 */
export type ContextMenuGroupProps = {
    /**
     * Unique key for the group.
     */
    key: string;
    /**
     * Indicates this is a group item.
     */
    type: "group";
    /**
     * Optional header text for the group.
     */
    header?: string;
    /**
     * The menu items within the group.
     */
    items: ContextMenuItem[];
};

/**
 * Union type representing all possible menu items.
 */
export type ContextMenuItem = ContextMenuItemProps | ContextMenuDividerProps | ContextMenuGroupProps;

type ContextMenuWithIconProps = {
    /**
     * Icon to use as the trigger button.
     */
    icon: FluentIcon;
    trigger?: never;
};

type ContextMenuWithTriggerProps = {
    icon?: never;
    /**
     * Custom trigger element for opening the menu.
     */
    trigger: ReactElement;
};

export type ContextMenuProps = BasePrimitiveProps &
    (ContextMenuWithIconProps | ContextMenuWithTriggerProps) & {
        /**
         * Array of menu items to display.
         */
        items: ContextMenuItem[];
        /**
         * Positioning of the menu relative to the trigger.
         */
        positioning?: FluentMenuProps["positioning"];
        /**
         * Called when the menu open state changes.
         */
        onOpenChange?: (open: boolean) => void;
    };

const IsDivider = (item: ContextMenuItem): item is ContextMenuDividerProps => {
    return "type" in item && item.type === "divider";
};

const IsGroup = (item: ContextMenuItem): item is ContextMenuGroupProps => {
    return "type" in item && item.type === "group";
};

const RenderMenuItem = (item: ContextMenuItemProps, classes: ReturnType<typeof useStyles>) => {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    const Icon = item.icon;
    return (
        <MenuItem
            key={item.key}
            className={classes.menuItem}
            icon={Icon ? <Icon className={classes.menuItemIcon} /> : undefined}
            onClick={item.onClick}
            disabled={item.disabled}
            secondaryContent={item.secondaryContent}
        >
            {item.label}
        </MenuItem>
    );
};

const RenderMenuItems = (items: ContextMenuItem[], classes: ReturnType<typeof useStyles>): ReactNode[] => {
    return items.map((item) => {
        if (IsDivider(item)) {
            return <MenuDivider key={item.key} />;
        }

        if (IsGroup(item)) {
            return (
                <MenuGroup key={item.key}>
                    {item.header && <MenuGroupHeader>{item.header}</MenuGroupHeader>}
                    {RenderMenuItems(item.items, classes)}
                </MenuGroup>
            );
        }

        return RenderMenuItem(item, classes);
    });
};

/**
 * A wrapper around Fluent UI's Menu component providing a simplified API for context menus.
 * Supports menu items with icons, dividers, and grouped items.
 */
export const ContextMenu = forwardRef<HTMLButtonElement, ContextMenuProps>((props, ref) => {
    const { items, onOpenChange, disabled } = props;
    const [open, setOpen] = useState(false);
    const classes = useStyles();

    const handleOpenChange = (_: unknown, data: { open: boolean }) => {
        setOpen(data.open);
        onOpenChange?.(data.open);
    };

    return (
        <Menu openOnContext open={open} onOpenChange={handleOpenChange}>
            <MenuTrigger disableButtonEnhancement>
                {props.trigger ?? (
                    <Button
                        ref={ref}
                        icon={props.icon}
                        onClick={(e) => {
                            e?.stopPropagation();
                            setOpen(true);
                        }}
                        disabled={disabled}
                    />
                )}
            </MenuTrigger>
            <MenuPopover className={classes.menuPopover}>
                <MenuList>{RenderMenuItems(items, classes)}</MenuList>
            </MenuPopover>
        </Menu>
    );
});

ContextMenu.displayName = "ContextMenu";
