import type { ReactElement, ReactNode } from "react";

import { Body1Strong, makeStyles, tokens } from "@fluentui/react-components";
import { AddRegular, CopyRegular, DeleteRegular } from "@fluentui/react-icons";
import { useMemo } from "react";

import { ButtonLine } from "../hoc/buttonLine";

const useListStyles = makeStyles({
    item: {
        width: "100%",
        display: "flex",
        flexDirection: "row", // Arrange items horizontally
        alignItems: "center", // Center items vertically
        gap: tokens.spacingHorizontalS, // Add space between elements
        borderBottom: `${tokens.strokeWidthThin} solid ${tokens.colorNeutralStroke1}`,
    },
    itemId: {
        width: tokens.spacingHorizontalM,
    },
    itemContent: {
        flex: 1, // Take up remaining space
        minWidth: 0, // Prevent flex item from overflowing
    },
    iconContainer: {
        display: "flex",
        gap: tokens.spacingHorizontalXS, // Small gap between icons
        alignItems: "center",
        flexShrink: 0, // Prevent shrinking
    },
    list: {
        padding: tokens.spacingVerticalS,
    },
});

/**
 * Represents an item in a list
 */
export type ListItem<T> = {
    /** Unique identifier for the item */
    id: number;
    /** The data associated with the item */
    data: T;
    /** Value to use for sorting the list */
    sortBy: number;
};

type ListProps<T> = {
    items: ListItem<T>[];
    renderItem: (item: ListItem<T>, index: number) => ReactNode;
    onDelete?: (item: ListItem<T>, index: number) => void;
    onAdd?: (item?: ListItem<T>) => void;
    addButtonLabel?: string;
};

/**
 * For cases where you may want to add / remove items from a list via a trash can button / copy button, this HOC can be used
 * @returns A React component that renders a list of items with add/delete functionality
 * @param props - The properties for the List component
 */
export function List<T>(props: ListProps<T>): ReactElement {
    const { items, renderItem, onDelete, onAdd, addButtonLabel = "Add new item" } = props;
    const classes = useListStyles();

    const sortedItems = useMemo(() => [...items].sort((a, b) => a.sortBy - b.sortBy), [items]);

    return (
        <div>
            {onAdd && <ButtonLine label={addButtonLabel} icon={AddRegular} onClick={() => onAdd()} />}

            <div className={classes.list}>
                {sortedItems.map((item: ListItem<T>, index: number) => (
                    <div key={item.id} className={classes.item}>
                        <Body1Strong className={classes.itemId}>#{index}</Body1Strong>
                        <div className={classes.itemContent}>{renderItem(item, items.indexOf(sortedItems[index]))}</div>
                        {(onAdd || onDelete) && (
                            <div className={classes.iconContainer}>
                                {onAdd && <CopyRegular onClick={() => onAdd(item)} />}
                                {onDelete && <DeleteRegular onClick={() => onDelete(item, items.indexOf(sortedItems[index]))} />}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
