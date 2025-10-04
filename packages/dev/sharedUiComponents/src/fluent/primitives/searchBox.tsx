import { makeStyles, tokens } from "@fluentui/react-components";
import { SearchBar } from "./searchBar";
import type { FunctionComponent } from "react";
import { useState, useEffect } from "react";

type SearchBoxProps = {
    items: string[];
    onItemSelected: (item: string) => void;
    title?: string;
};

const useSearchBoxStyles = makeStyles({
    searchBox: {
        width: "300px",
        height: "400px",
        backgroundColor: tokens.colorNeutralBackground1,
        border: `${tokens.strokeWidthThick} solid ${tokens.colorNeutralStroke1}`,
        borderRadius: tokens.borderRadiusMedium,
        boxShadow: tokens.shadow16,
        display: "grid",
        gridTemplateRows: "auto auto 1fr",
        overflow: "hidden", // Prevent content overflow
    },
    title: {
        borderBottom: `${tokens.strokeWidthThin} solid ${tokens.colorNeutralStroke2}`,
        margin: tokens.spacingVerticalXS,
        paddingBottom: tokens.spacingVerticalXS,
        color: tokens.colorNeutralForeground1,
        gridRow: "1",
        fontSize: tokens.fontSizeBase300,
        fontWeight: tokens.fontWeightSemibold,
    },
    filterContainer: {
        margin: tokens.spacingVerticalXS,
        paddingBottom: tokens.spacingVerticalXS,
        gridRow: "2",
    },
    list: {
        gridRow: "3",
        overflowY: "auto",
        display: "flex",
        flexDirection: "column",
        maxHeight: "100%",
    },
    listItem: {
        marginLeft: tokens.spacingHorizontalXS,
        marginRight: tokens.spacingHorizontalXS,
        cursor: "pointer",
        color: tokens.colorNeutralForeground1,
        marginTop: tokens.spacingVerticalXXS,
        marginBottom: tokens.spacingVerticalXXS,
        padding: tokens.spacingVerticalXS,
        borderRadius: tokens.borderRadiusSmall,

        // eslint-disable-next-line @typescript-eslint/naming-convention
        ":hover": {
            backgroundColor: tokens.colorNeutralBackground2Hover,
        },
    },
    listItemSelected: {
        backgroundColor: tokens.colorBrandBackground,
        color: tokens.colorNeutralForegroundOnBrand,

        // eslint-disable-next-line @typescript-eslint/naming-convention
        ":hover": {
            backgroundColor: tokens.colorBrandBackgroundHover,
        },
    },
});

/**
 * SearchBox component that displays a popup with search functionality
 * @param props - The component props
 * @returns The search box component
 */
export const SearchBox: FunctionComponent<SearchBoxProps> = (props) => {
    SearchBox.displayName = "SearchBox";

    const classes = useSearchBoxStyles();
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [items, setItems] = useState(props.items);
    // In future could replace this with a fluent component like menuList or comboBox depending on desired UX
    const onKeyDown = (evt: React.KeyboardEvent) => {
        if (items.length === 0) {
            return;
        }
        if (evt.code === "Enter") {
            props.onItemSelected(items[selectedIndex]);
            return;
        }

        if (evt.code === "ArrowDown") {
            setSelectedIndex((prev) => Math.min(prev + 1, items.length - 1));
            return;
        }

        if (evt.code === "ArrowUp") {
            setSelectedIndex((prev) => Math.max(prev - 1, 0));
            return;
        }
    };

    const onFilterChange = (filter: string) => {
        const filteredItems = props.items.filter((item) => item.toLowerCase().includes(filter.toLowerCase()));
        setItems(filteredItems);
    };

    useEffect(() => {
        setItems(props.items);
    }, [props.items]);

    return (
        <div className={classes.searchBox} onKeyDown={onKeyDown}>
            {props.title ? <div className={classes.title}>{props.title}</div> : null}
            <div className={classes.filterContainer}>
                <SearchBar onChange={onFilterChange} placeholder="Search..." />
            </div>
            <div role="listbox" className={classes.list}>
                {items.map((item, index) => (
                    <div
                        role="option"
                        key={item}
                        className={`${classes.listItem} ${index === selectedIndex ? classes.listItemSelected : ""}`}
                        onClick={() => props.onItemSelected(item)}
                    >
                        {item}
                    </div>
                ))}
            </div>
        </div>
    );
};
