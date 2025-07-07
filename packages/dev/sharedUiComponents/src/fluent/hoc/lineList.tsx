import { CopyRegular, DeleteRegular } from "@fluentui/react-icons";
import { useEffect, type FunctionComponent, type ReactNode } from "react";
import { ButtonLine } from "./buttonLine";
import { Body1Strong, makeStyles, tokens } from "@fluentui/react-components";

/**
 * Represents an item in a line list
 */
export type LineListItem<T = any> = {
    /** Unique identifier for the item */
    id: number;
    /** The data associated with the item */
    data: T;
};

type LineListProps<T = any> = {
    items: LineListItem<T>[];
    renderItem: (item: LineListItem<T>, index: number) => ReactNode;
    onDelete: (item: LineListItem<T>, index: number) => void;
    onAdd: (item?: LineListItem<T>) => void;
    addButtonLabel?: string;
};

const useLineListStyles = makeStyles({
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
        backgroundColor: "pink",
    },
});
/**
 * For cases where you may want to add / remove lines from a list via a trash can button / copy button, this HOC can be used
 * @returns A React component that renders a list of items with add/delete functionality
 * @param props - The properties for the LineList component
 */
export const LineList: FunctionComponent<LineListProps<any>> = (props): React.ReactElement => {
    const { items, renderItem, onDelete, onAdd, addButtonLabel = "Add new item" } = props;
    const classes = useLineListStyles();
    useEffect(() => {
        global.console.log("LineList items updated");
    }, [props.items, props.renderItem]);
    return (
        <div>
            <ButtonLine label={addButtonLabel} onClick={() => onAdd()} />

            <div className={classes.list}>
                {items.map((item: LineListItem<any>, index: number) => (
                    <div key={item.id} className={classes.item}>
                        <Body1Strong className={classes.itemId}>#{item.id}</Body1Strong>
                        <div className={classes.itemContent}>{renderItem(item, index)}</div>
                        <div className={classes.iconContainer}>
                            <CopyRegular onClick={() => onAdd(item)} />
                            <DeleteRegular onClick={() => onDelete(item, index)} />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
