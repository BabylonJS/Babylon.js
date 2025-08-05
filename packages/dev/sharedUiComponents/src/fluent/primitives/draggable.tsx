import { makeStyles, tokens } from "@fluentui/react-components";
import { DeleteFilled } from "@fluentui/react-icons";

export type DraggableLineProps = {
    format: string;
    data: string;
    tooltip: string;
    label: string;
    onDelete?: () => void;
};

const useDraggableStyles = makeStyles({
    draggable: {
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        columnGap: tokens.spacingHorizontalS,
        cursor: "grab",
        textAlign: "center",
        boxSizing: "border-box",
        margin: `${tokens.spacingVerticalXS} 0px`,
        padding: `${tokens.spacingVerticalSNudge} ${tokens.spacingHorizontalMNudge}`,

        // Button-like styling
        backgroundColor: tokens.colorNeutralBackground1,
        border: `${tokens.strokeWidthThin} solid ${tokens.colorNeutralStroke1}`,
        borderRadius: tokens.borderRadiusMedium,
        color: tokens.colorNeutralForeground1,
        fontSize: tokens.fontSizeBase300,
        fontFamily: tokens.fontFamilyBase,
        fontWeight: tokens.fontWeightRegular,
        lineHeight: tokens.lineHeightBase300,
        minHeight: "32px",

        // eslint-disable-next-line @typescript-eslint/naming-convention
        ":hover": {
            backgroundColor: tokens.colorNeutralBackground1Hover,
        },

        // eslint-disable-next-line @typescript-eslint/naming-convention
        ":active": {
            backgroundColor: tokens.colorNeutralBackground1Pressed,
        },
    },
    icon: {
        pointerEvents: "auto", // re‑enable interaction
        display: "flex",
        alignItems: "center",
        position: "absolute",
        right: tokens.spacingHorizontalSNudge,
        color: tokens.colorNeutralForeground2,
        cursor: "pointer",
        fontSize: tokens.fontSizeBase400,

        // eslint-disable-next-line @typescript-eslint/naming-convention
        ":hover": {
            color: tokens.colorNeutralForeground2Hover,
        },
    },
});

export const DraggableLine: React.FunctionComponent<DraggableLineProps> = (props) => {
    const classes = useDraggableStyles();
    return (
        <div
            className={classes.draggable}
            title={props.tooltip}
            draggable={true}
            onDragStart={(event) => {
                event.dataTransfer.setData(props.format, props.data);
            }}
        >
            {props.label}
            {props.onDelete && <DeleteFilled className={classes.icon} onClick={props.onDelete} />}
        </div>
    );
};
