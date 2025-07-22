import { makeStyles, tokens, Popover, PopoverSurface, PopoverTrigger } from "@fluentui/react-components";
import type { OnOpenChangeData, OpenPopoverEvents } from "@fluentui/react-components";
import { SearchBar } from "./searchBar";
import type { FunctionComponent, PropsWithChildren } from "react";
import { useState, useEffect } from "react";

// type SearchBoxProps = {
//     isVisible: boolean;
//     targetX: number;
//     targetY: number;
//     items: string[];
//     filter: string;
//     selectedIndex: number;
//     onFilterChange: (filter: string) => void;
//     onItemSelected: (item: string) => void;
//     onKeyDown: (evt: React.KeyboardEvent) => void;
//     onHide: () => void;
//     containerElement?: HTMLElement;
//     title?: string;
// };

// const useSearchBoxStyles = makeStyles({
//     container: {
//         position: "absolute",
//         width: "100%",
//         height: "100%",
//         left: "0",
//         top: "0",
//         zIndex: "1000",
//     },
//     blocker: {
//         position: "absolute",
//         width: "100%",
//         height: "100%",
//         left: "0",
//         top: "0",
//         cursor: "default",
//         backgroundColor: "transparent",
//     },
//     searchBox: {
//         width: "300px",
//         height: "400px",
//         position: "absolute",
//         backgroundColor: tokens.colorNeutralBackground1,
//         border: `${tokens.strokeWidthThick} solid ${tokens.colorNeutralStroke1}`,
//         borderRadius: tokens.borderRadiusMedium,
//         boxShadow: tokens.shadow16,
//         cursor: "auto",
//         display: "grid",
//         gridTemplateRows: "auto auto 1fr",
//         zIndex: "1001",
//     },
//     title: {
//         borderBottom: `${tokens.strokeWidthThin} solid ${tokens.colorNeutralStroke2}`,
//         margin: tokens.spacingVerticalXS,
//         paddingBottom: tokens.spacingVerticalXS,
//         color: tokens.colorNeutralForeground1,
//         gridRow: "1",
//         fontSize: tokens.fontSizeBase300,
//         fontWeight: tokens.fontWeightSemibold,
//     },
//     filterContainer: {
//         margin: tokens.spacingVerticalXS,
//         paddingBottom: tokens.spacingVerticalXS,
//         gridRow: "2",
//     },
//     list: {
//         gridRow: "3",
//         overflowY: "auto",
//         display: "flex",
//         flexDirection: "column",
//         maxHeight: "100%",
//     },
//     listItem: {
//         marginLeft: tokens.spacingHorizontalXS,
//         marginRight: tokens.spacingHorizontalXS,
//         cursor: "pointer",
//         color: tokens.colorNeutralForeground1,
//         marginTop: tokens.spacingVerticalXXS,
//         marginBottom: tokens.spacingVerticalXXS,
//         padding: tokens.spacingVerticalXS,
//         borderRadius: tokens.borderRadiusSmall,

//         // eslint-disable-next-line @typescript-eslint/naming-convention
//         ":hover": {
//             backgroundColor: tokens.colorNeutralBackground2Hover,
//         },
//     },
//     listItemSelected: {
//         backgroundColor: tokens.colorBrandBackground,
//         color: tokens.colorNeutralForegroundOnBrand,

//         // eslint-disable-next-line @typescript-eslint/naming-convention
//         ":hover": {
//             backgroundColor: tokens.colorBrandBackgroundHover,
//         },
//     },
// });

// /**
//  * SearchBox component that displays a popup with search functionality
//  * @param props - The component props
//  * @returns The search box component
//  */
// export const SearchBox: FunctionComponent<SearchBoxProps> = (props) => {
//     const classes = useSearchBoxStyles();
//     const searchBoxRef = useRef<HTMLDivElement>(null);

//     const [position, setPosition] = useState({ left: "0px", top: "0px" });

//     useEffect(() => {
//         if (!props.isVisible) {
//             return;
//         }

//         const expectedWidth = 300;
//         const expectedHeight = 400;

//         let containerRect = { x: 0, y: 0, width: window.innerWidth, height: window.innerHeight };

//         if (props.containerElement) {
//             containerRect = props.containerElement.getBoundingClientRect();
//         }

//         let targetX = props.targetX - (expectedWidth / 2 + containerRect.x);
//         let targetY = props.targetY - (expectedHeight / 2 + containerRect.y);

//         // Boundary checks to keep the search box within the container
//         if (targetX + expectedWidth > containerRect.width) {
//             targetX = containerRect.width - expectedWidth - 10;
//         } else if (targetX < 10) {
//             targetX = 10;
//         }

//         if (targetY + expectedHeight > containerRect.height) {
//             targetY = containerRect.height - expectedHeight - 10;
//         } else if (targetY < 10) {
//             targetY = 10;
//         }

//         setPosition({
//             left: targetX + "px",
//             top: targetY + "px",
//         });
//     }, [props.isVisible, props.targetX, props.targetY, props.containerElement]);

//     if (!props.isVisible) {
//         return null;
//     }

//     return (
//         <div className={classes.container}>
//             <div className={classes.blocker} onClick={props.onHide} />
//             <div ref={searchBoxRef} className={classes.searchBox} style={position}>
//                 <div className={classes.title}>{props.title || "Add a node"}</div>
//                 <div className={classes.filterContainer}>
//                     <SearchBar onChange={props.onFilterChange} placeholder="Search..." value={props.filter} onKeyDown={props.onKeyDown} autoFocus={true} />
//                 </div>
//                 <div className={classes.list}>
//                     {props.items.map((item, index) => (
//                         <div
//                             key={item}
//                             className={`${classes.listItem} ${index === props.selectedIndex ? classes.listItemSelected : ""}`}
//                             onClick={() => props.onItemSelected(item)}
//                         >
//                             {item}
//                         </div>
//                     ))}
//                 </div>
//             </div>
//         </div>
//     );
// };

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
        // overflow: "hidden", // Prevent content overflow
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

type PositionedPopoverProps = {
    x: number;
    y: number;
    visible: boolean;
    hide: () => void;
};

/**
 * PositionedPopover component that shows a popover at specific coordinates
 * @param props - The component props
 * @returns The positioned popover component
 */
export const PositionedPopover: FunctionComponent<PropsWithChildren<PositionedPopoverProps>> = (props) => {
    const [open, setOpen] = useState(false);

    useEffect(() => {
        setOpen(props.visible);
    }, [props.visible, props.x, props.y]);

    const handleOpenChange = (_: OpenPopoverEvents, data: OnOpenChangeData) => {
        setOpen(data.open);

        if (!data.open) {
            props.hide();
        }
    };

    return (
        <>
            <Popover
                open={open}
                onOpenChange={handleOpenChange}
                positioning={{
                    position: "below", // Places the popover directly below the trigger element
                    align: "center", // Centers the popover horizontally relative to the trigger element
                    autoSize: "height-always", //Automatically adjusts the popover height to fit within the viewport
                    fallbackPositions: ["above", "after", "before"], //If the primary position doesn't fit, automatically tries these positions in order
                }}
                withArrow={false} // Removes arrow that points to trigger element
            >
                <PopoverTrigger>
                    {/* Use the invisible div as the trigger location*/}
                    <div
                        style={{
                            position: "absolute",
                            left: `${props.x}px`,
                            top: `${props.y}px`,
                            width: 1,
                            height: 1,
                            pointerEvents: "none", // so it's invisible to interaction
                        }}
                    />
                </PopoverTrigger>
                <PopoverSurface>{props.children}</PopoverSurface>
            </Popover>
        </>
    );
};
