import { type FunctionComponent } from "react";

import { makeStyles, tokens } from "@fluentui/react-components";

const useStyles = makeStyles({
    line: {
        display: "block",
        padding: `${tokens.spacingVerticalXS} ${tokens.spacingHorizontalS}`,
        margin: `2px 0`,
        background: tokens.colorNeutralBackground2,
        borderRadius: tokens.borderRadiusSmall,
        color: tokens.colorNeutralForeground1,
        fontSize: tokens.fontSizeBase200,
        cursor: "grab",
        userSelect: "none",
        ":hover": {
            background: tokens.colorNeutralBackground2Hover,
        },
        ":active": {
            cursor: "grabbing",
        },
    },
});

export interface IDraggableLineProps {
    /** The data string transferred via the `babylonjs-flow-graph-node` drag MIME type. */
    data: string;
    /** Tooltip shown on hover. */
    tooltip: string;
    /** Optional accent color shown as a left border strip. */
    color?: string;
}

/**
 * A small Fluent-styled line item that the user can drag onto the canvas to instantiate
 * a flow graph block (or composite template).
 *
 * Replaces the legacy `sharedComponents/draggableLineComponent.tsx` and is intentionally
 * kept local — `dnd-kit` would be overkill for this trivial native HTML5 drag interaction.
 * @returns The rendered draggable line element.
 */
export const DraggableLine: FunctionComponent<IDraggableLineProps> = ({ data, tooltip, color }) => {
    const classes = useStyles();
    const borderStyle = color ? { borderLeft: `4px solid ${color}` } : undefined;
    const display = data.startsWith("FlowGraph") ? data.slice(9).replace("Block", "") : data.replace("Block", "");

    return (
        <div
            className={classes.line}
            title={tooltip}
            style={borderStyle}
            draggable
            onDragStart={(event) => {
                event.dataTransfer.setData("babylonjs-flow-graph-node", data);
            }}
        >
            {display}
        </div>
    );
};
