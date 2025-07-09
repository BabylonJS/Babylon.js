import {
    makeStyles,
    Menu,
    MenuButton,
    MenuItem,
    MenuList,
    MenuPopover,
    MenuTrigger,
    mergeClasses,
    Overflow,
    OverflowItem,
    tokens,
    useIsOverflowItemVisible,
    useOverflowMenu,
} from "@fluentui/react-components";
import type { OverflowItemProps } from "@fluentui/react-components";
import type { FunctionComponent, PropsWithChildren } from "react";

const usePreviewPanelStyles = makeStyles({
    panel: {
        // flex: 1,
        // overflow: "hidden",
        // display: "flex",
        // flexDirection: "column",
    },
    canvas: {},
    header: {
        height: "50px",
        width: "24px",
    },
    footer: {
        height: "24px",
        width: "24px",
    },
});

export type PreviewPanelProps = {
    headerDropdown?: JSX.Element;
    headerIcons?: JSX.Element[];
    footerDropdown?: JSX.Element;
    footerIcons?: JSX.Element[];
};
export const PreviewPanel: FunctionComponent<PropsWithChildren<PreviewPanelProps>> = (props) => {
    const classes = usePreviewPanelStyles();
    return (
        <div className={classes.panel}>
            <div className={classes.header}>
                {props.headerDropdown}
                {props.headerIcons && <IconHeader icons={props.headerIcons} />}
            </div>
            <div className={classes.canvas}></div>
            <div className={classes.footer}>
                {props.footerDropdown}
                {props.footerIcons && <IconHeader icons={props.footerIcons} />}
            </div>
        </div>
    );
};

const useStyles = makeStyles({
    container: {
        display: "flex",
        flexWrap: "nowrap",
        minWidth: 0,
        overflow: "hidden",
    },

    resizableArea: {
        minWidth: "200px",
        maxWidth: "800px",
        border: `2px solid ${tokens.colorBrandBackground}`,
        padding: "20px 10px 10px 10px",
        position: "relative",
        resize: "horizontal",
        // // eslint-disable-next-line @typescript-eslint/naming-convention
        // "::after": {
        //     content: `'Resizable Area'`,
        //     position: "absolute",
        //     padding: "1px 4px 1px",
        //     top: "-2px",
        //     left: "-2px",
        //     fontFamily: "monospace",
        //     fontSize: "15px",
        //     fontWeight: 900,
        //     lineHeight: 1,
        //     letterSpacing: "1px",
        //     color: tokens.colorNeutralForegroundOnBrand,
        //     backgroundColor: tokens.colorBrandBackground,
        // },
    },
});

export const IconHeader: FunctionComponent<{ icons: JSX.Element[] }> = (props) => {
    const styles = useStyles();
    const { icons } = props;
    const itemIds = icons.map((_, i) => i.toString());

    return (
        <Overflow>
            <div className={mergeClasses(styles.container, styles.resizableArea)}>
                {icons.map((iconItem, i) => (
                    <OverflowIconButton key={i.toString()} icon={iconItem} />
                ))}
                <OverflowMenu itemIds={itemIds} />
            </div>
        </Overflow>
    );
};

const OverflowIconButton: FunctionComponent<{ icon: JSX.Element } & { key: string }> = (props) => {
    const { key } = props;
    const isVisible = useIsOverflowItemVisible(key);
    return isVisible ? (
        <OverflowItem id={key} key={key}>
            {props.icon}
        </OverflowItem>
    ) : null;
};

const OverflowMenuItem: FunctionComponent<Pick<OverflowItemProps, "id">> = (props) => {
    const { id } = props;
    const isVisible = useIsOverflowItemVisible(id);

    if (isVisible) {
        return null;
    }

    // As an union between button props and div props may be conflicting, casting is required
    return <MenuItem>Item {id}</MenuItem>;
};

const OverflowMenu: React.FC<{ itemIds: string[] }> = ({ itemIds }) => {
    const { ref, overflowCount, isOverflowing } = useOverflowMenu<HTMLButtonElement>();

    if (!isOverflowing) {
        return null;
    }

    return (
        <Menu>
            <MenuTrigger disableButtonEnhancement>
                <MenuButton ref={ref}>+{overflowCount} items</MenuButton>
            </MenuTrigger>

            <MenuPopover>
                <MenuList>
                    {itemIds.map((i) => {
                        return <OverflowMenuItem key={i} id={i} />;
                    })}
                </MenuList>
            </MenuPopover>
        </Menu>
    );
};
