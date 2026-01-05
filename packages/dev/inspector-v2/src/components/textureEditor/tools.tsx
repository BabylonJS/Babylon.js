import type { ComponentType, FunctionComponent } from "react";
import type { IMetadata } from "./textureEditor";

import { Divider, makeStyles, ToggleButton, tokens, Tooltip } from "@fluentui/react-components";
import { useCallback } from "react";

import { Color3, Color4 } from "core/Maths/math.color";
import { ColorPickerPopup } from "shared-ui-components/fluent/primitives/colorPicker";

const useStyles = makeStyles({
    toolbar: {
        display: "flex",
        flexDirection: "column",
        backgroundColor: tokens.colorNeutralBackground1,
        padding: tokens.spacingVerticalXS,
        gap: tokens.spacingVerticalXS,
        borderRadius: tokens.borderRadiusMedium,
        boxShadow: tokens.shadow8,
    },
    toolsSection: {
        display: "flex",
        flexDirection: "column",
        gap: tokens.spacingVerticalXXS,
    },
    toolButton: {
        minWidth: "36px",
        minHeight: "36px",
        padding: tokens.spacingVerticalXS,
    },
    toolIcon: {
        width: "24px",
        height: "24px",
    },
    colorSection: {
        display: "flex",
        justifyContent: "center",
        margin: tokens.spacingVerticalS,
    },
});

type ToolBarProps = {
    tools: readonly { name: string; icon: ComponentType }[];
    changeTool: (toolIndex: number) => void;
    activeToolIndex: number;
    metadata: IMetadata;
    setMetadata: (data: any) => void;
    hasAlpha: boolean;
};

/**
 * Toolbar component for texture editing tools
 * @param props - The toolbar properties
 * @returns The toolbar component
 */
export const ToolBar: FunctionComponent<ToolBarProps> = (props) => {
    const { tools, changeTool, activeToolIndex, metadata, setMetadata, hasAlpha } = props;

    const classes = useStyles();

    const computeRGBAColor = useCallback(() => {
        const opacityInt = Math.floor(metadata.alpha * 255);
        const opacityHex = opacityInt.toString(16).padStart(2, "0");
        return Color4.FromHexString(`${metadata.color}${opacityHex}`);
    }, [metadata.color, metadata.alpha]);

    const handleColorChange = useCallback(
        (color: Color3 | Color4) => {
            const newMetadata = {
                color: color.toHexString(true),
                alpha: (color as Partial<Color4>).a ?? 1,
            };
            if (newMetadata.color !== metadata.color || newMetadata.alpha !== metadata.alpha) {
                setMetadata(newMetadata);
            }
        },
        [metadata, setMetadata]
    );

    const handleToolClick = useCallback(
        (index: number) => {
            if (activeToolIndex === index) {
                // Deselect current tool
                changeTool(-1);
            } else {
                changeTool(index);
            }
        },
        [activeToolIndex, changeTool]
    );

    return (
        <div className={classes.toolbar}>
            <div className={classes.colorSection}>
                <Tooltip relationship="label" content="Pick Tool Color" positioning="after">
                    <ColorPickerPopup value={hasAlpha ? computeRGBAColor() : Color3.FromHexString(metadata.color)} onChange={handleColorChange} />
                </Tooltip>
            </div>
            <Divider />
            <div className={classes.toolsSection}>
                {tools.map((tool, index) => {
                    return (
                        <Tooltip key={index} content={tool.name} relationship="label" positioning="after">
                            <ToggleButton
                                className={classes.toolButton}
                                appearance="subtle"
                                checked={index === activeToolIndex}
                                onClick={() => handleToolClick(index)}
                                icon={<tool.icon />}
                            />
                        </Tooltip>
                    );
                })}
            </div>
        </div>
    );
};
