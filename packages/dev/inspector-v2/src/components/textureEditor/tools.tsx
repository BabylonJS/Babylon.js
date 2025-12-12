import type { ComponentType, FunctionComponent } from "react";
import { useCallback } from "react";

import { makeStyles, tokens, Tooltip, ToggleButton } from "@fluentui/react-components";
import { Color3, Color4 } from "core/Maths/math.color";

import { ColorPickerPopup } from "shared-ui-components/fluent/primitives/colorPicker";

import type { IMetadata } from "./textureEditor";

const useStyles = makeStyles({
    toolbar: {
        display: "flex",
        flexDirection: "column",
        padding: tokens.spacingVerticalXS,
        gap: tokens.spacingVerticalXS,
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

interface IToolBarProps {
    tools: readonly { name: string; icon: ComponentType }[];
    changeTool: (toolIndex: number) => void;
    activeToolIndex: number;
    metadata: IMetadata;
    setMetadata: (data: any) => void;
    hasAlpha: boolean;
}

/**
 * Toolbar component for texture editing tools
 * @param props - The toolbar properties
 * @returns The toolbar component
 */
export const ToolBar: FunctionComponent<IToolBarProps> = (props) => {
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
                <ColorPickerPopup value={hasAlpha ? computeRGBAColor() : Color3.FromHexString(metadata.color)} onChange={handleColorChange} />
            </div>
            <div className={classes.toolsSection}>
                {tools.map((tool, index) => {
                    // eslint-disable-next-line @typescript-eslint/naming-convention
                    const IconComponent = tool.icon;
                    return (
                        <Tooltip key={index} content={tool.name} relationship="label" positioning="after">
                            <ToggleButton
                                className={classes.toolButton}
                                appearance="subtle"
                                checked={index === activeToolIndex}
                                onClick={() => handleToolClick(index)}
                                icon={<IconComponent />}
                            />
                        </Tooltip>
                    );
                })}
            </div>
        </div>
    );
};
