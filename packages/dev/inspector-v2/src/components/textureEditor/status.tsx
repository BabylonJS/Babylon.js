import { type FunctionComponent } from "react";

import { type ITextureEditorSource } from "./textureEditorSource";

import { makeStyles, tokens } from "@fluentui/react-components";

const useStyles = makeStyles({
    statusBar: {
        display: "flex",
        backgroundColor: tokens.colorNeutralBackground1,
        alignItems: "center",
        justifyContent: "space-between",
        padding: `${tokens.spacingVerticalXS} ${tokens.spacingHorizontalM}`,
        fontSize: tokens.fontSizeBase200,
        color: tokens.colorNeutralForeground2,
        borderTop: `1px solid ${tokens.colorNeutralStroke1}`,
        minHeight: "24px",
    },
    fileName: {
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
    },
    mipInfo: {
        flexShrink: 0,
    },
});

type StatusBarProps = {
    source: ITextureEditorSource;
    mipLevel: number;
};

/**
 * Displays status information about the texture
 * @param props - The status bar properties
 * @returns The status bar component
 */
export const StatusBar: FunctionComponent<StatusBarProps> = (props) => {
    const { source, mipLevel } = props;
    const classes = useStyles();

    const factor = Math.pow(2, mipLevel);
    const width = Math.max(1, Math.floor(source.size.width / factor));
    const height = Math.max(1, Math.floor(source.size.height / factor));

    return (
        <div className={classes.statusBar}>
            <span className={classes.fileName}>{source.name}</span>
            {!source.noMipmap && (
                <span className={classes.mipInfo}>
                    MIP Preview: {mipLevel} ({width}×{height})
                </span>
            )}
        </div>
    );
};
