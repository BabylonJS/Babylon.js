import { makeStyles, tokens } from "@fluentui/react-components";
import { DeleteFilled } from "@fluentui/react-icons";
import { LineContainer } from "../hoc/propertyLines/propertyLine";

export type DraggableLineProps = {
    format: string;
    data: string;
    tooltip: string;
    label: string;
    onDelete?: () => void;
};

const useDraggableStyles = makeStyles({
    draggable: {
        display: "inline-flex",
        alignItems: "center",
        columnGap: tokens.spacingHorizontalS,
        cursor: "grab",
        textAlign: "center",
        boxSizing: "border-box",
        borderBottom: "black",
        margin: `${tokens.spacingVerticalXS} 0px`,
        border: `${tokens.strokeWidthThin} solid ${tokens.colorNeutralStroke1}`,

        // eslint-disable-next-line @typescript-eslint/naming-convention
        ":hover": {
            backgroundColor: tokens.colorBrandBackground2Hover,
        },
    },
    icon: {
        pointerEvents: "auto", // re‑enable interaction
        display: "flex",
        alignItems: "center",
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
            <LineContainer>
                {props.label}
                {props.onDelete && <DeleteFilled className={classes.icon} onClick={props.onDelete} />}
            </LineContainer>
        </div>
    );
};
