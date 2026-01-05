import type { FunctionComponent } from "react";

import type { BaseTexture, ISize } from "core/index";
import type { IPixelData } from "./canvasManager";

import { Input, Label, makeStyles, tokens, Toolbar, ToolbarButton, ToolbarDivider, Tooltip } from "@fluentui/react-components";
import { ArrowResetRegular, ArrowUploadRegular, ChevronDownRegular, ChevronUpRegular, ResizeRegular, SaveRegular } from "@fluentui/react-icons";
import { useCallback, useEffect, useRef, useState } from "react";

const useStyles = makeStyles({
    propertiesBar: {
        display: "flex",
        backgroundColor: tokens.colorNeutralBackground1,
        alignItems: "center",
        padding: `${tokens.spacingVerticalXS} ${tokens.spacingHorizontalS}`,
        gap: tokens.spacingHorizontalS,
        borderBottom: `1px solid ${tokens.colorNeutralStroke1}`,
        flexWrap: "wrap",
    },
    section: {
        display: "flex",
        alignItems: "center",
        gap: tokens.spacingHorizontalXS,
    },
    dimensionsForm: {
        display: "flex",
        alignItems: "center",
        gap: tokens.spacingHorizontalXS,
    },
    dimensionInput: {
        width: "60px",
    },
    pixelData: {
        display: "flex",
        alignItems: "center",
        gap: tokens.spacingHorizontalXS,
        fontSize: tokens.fontSizeBase200,
        fontFamily: tokens.fontFamilyMonospace,
    },
    pixelDataLabel: {
        color: tokens.colorNeutralForeground3,
    },
    pixelDataValue: {
        color: tokens.colorNeutralForeground1,
        minWidth: "32px",
    },
    faceButton: {
        minWidth: "auto",
        paddingLeft: tokens.spacingHorizontalS,
        paddingRight: tokens.spacingHorizontalS,
    },
    spacer: {
        flex: 1,
    },
    uploadInput: {
        display: "none",
    },
});

type PropertiesBarProps = {
    texture: BaseTexture;
    size: ISize;
    saveTexture: () => void;
    pixelData: IPixelData;
    face: number;
    setFace: (face: number) => void;
    resetTexture: () => void;
    resizeTexture: (width: number, height: number) => void;
    uploadTexture: (file: File) => void;
    mipLevel: number;
    setMipLevel: (mipLevel: number) => void;
};

const PixelDataDisplay: FunctionComponent<{ label: string; value: number | undefined }> = ({ label, value }) => {
    const classes = useStyles();
    return (
        <span className={classes.pixelData}>
            <Label className={classes.pixelDataLabel}>{label}:</Label>
            <Label className={classes.pixelDataValue}>{value !== undefined ? value : "-"}</Label>
        </span>
    );
};

const CubeFaces = ["+X", "-X", "+Y", "-Y", "+Z", "-Z"] as const;

/**
 * Properties bar component showing texture info and actions
 * @param props - The properties bar properties
 * @returns The properties bar component
 */
export const PropertiesBar: FunctionComponent<PropertiesBarProps> = (props) => {
    const { texture, size, saveTexture, pixelData, face, setFace, resetTexture, resizeTexture, uploadTexture, mipLevel, setMipLevel } = props;

    const classes = useStyles();
    const uploadInputRef = useRef<HTMLInputElement>(null);
    const [width, setWidth] = useState(size.width);
    const [height, setHeight] = useState(size.height);

    // Update local state when size prop changes
    useEffect(() => {
        setWidth(size.width);
        setHeight(size.height);
    }, [size.width, size.height]);

    const maxLevels = Math.floor(Math.log2(Math.max(texture.getSize().width, texture.getSize().height)));
    const engine = texture.getScene()?.getEngine();
    const mipsEnabled = !texture.noMipmap && engine?.getCaps().textureLOD;

    const handleUploadClick = useCallback(() => {
        uploadInputRef.current?.click();
    }, []);

    const handleFileChange = useCallback(
        (evt: React.ChangeEvent<HTMLInputElement>) => {
            const files = evt.target.files;
            if (files && files.length) {
                uploadTexture(files[0]);
            }
            evt.target.value = "";
        },
        [uploadTexture]
    );

    const handleResize = useCallback(() => {
        resizeTexture(width, height);
    }, [width, height, resizeTexture]);

    const getNewDimension = (oldDim: number, newDim: string): number => {
        const parsed = parseInt(newDim);
        if (!isNaN(parsed) && parsed > 0 && Number.isInteger(parsed)) {
            return parsed;
        }
        return oldDim;
    };

    return (
        <div className={classes.propertiesBar}>
            {/* Dimensions Section */}
            <div className={classes.section}>
                <Label>W:</Label>
                <Input
                    className={classes.dimensionInput}
                    size="small"
                    type="text"
                    value={width.toString()}
                    readOnly={texture.isCube}
                    onChange={(_, data) => setWidth(getNewDimension(width, data.value))}
                />
                <Label>H:</Label>
                <Input
                    className={classes.dimensionInput}
                    size="small"
                    type="text"
                    value={height.toString()}
                    readOnly={texture.isCube}
                    onChange={(_, data) => setHeight(getNewDimension(height, data.value))}
                />
                {!texture.isCube && (
                    <Tooltip content="Resize" relationship="label">
                        <ToolbarButton icon={<ResizeRegular />} onClick={handleResize} />
                    </Tooltip>
                )}
            </div>

            <ToolbarDivider />

            {/* Pixel Coordinates */}
            <div className={classes.section}>
                <PixelDataDisplay label="X" value={pixelData.x} />
                <PixelDataDisplay label="Y" value={pixelData.y} />
            </div>

            <ToolbarDivider />

            {/* Pixel Color */}
            <div className={classes.section}>
                <PixelDataDisplay label="R" value={pixelData.r} />
                <PixelDataDisplay label="G" value={pixelData.g} />
                <PixelDataDisplay label="B" value={pixelData.b} />
                <PixelDataDisplay label="A" value={pixelData.a} />
            </div>

            {/* Cube Face Selection */}
            {texture.isCube && (
                <>
                    <ToolbarDivider />
                    <Toolbar size="small">
                        {CubeFaces.map((label, index) => (
                            <ToolbarButton key={label} className={classes.faceButton} appearance={face === index ? "primary" : "subtle"} onClick={() => setFace(index)}>
                                {label}
                            </ToolbarButton>
                        ))}
                    </Toolbar>
                </>
            )}

            {/* Mip Level Controls */}
            {mipsEnabled && (
                <>
                    <ToolbarDivider />
                    <div className={classes.section}>
                        <Label>MIP:</Label>
                        <Tooltip content="Mip Preview Up" relationship="label">
                            <ToolbarButton icon={<ChevronUpRegular />} disabled={mipLevel <= 0} onClick={() => setMipLevel(mipLevel - 1)} />
                        </Tooltip>
                        <Label>{mipLevel}</Label>
                        <Tooltip content="Mip Preview Down" relationship="label">
                            <ToolbarButton icon={<ChevronDownRegular />} disabled={mipLevel >= maxLevels} onClick={() => setMipLevel(mipLevel + 1)} />
                        </Tooltip>
                    </div>
                </>
            )}

            <div className={classes.spacer} />

            {/* Actions */}
            <Toolbar size="small">
                <Tooltip content="Reset" relationship="label">
                    <ToolbarButton icon={<ArrowResetRegular />} onClick={resetTexture} />
                </Tooltip>
                <Tooltip content="Upload" relationship="label">
                    <ToolbarButton icon={<ArrowUploadRegular />} onClick={handleUploadClick} />
                </Tooltip>
                <input ref={uploadInputRef} className={classes.uploadInput} type="file" accept=".jpg, .png, .tga, .dds, .env, .exr" onChange={handleFileChange} />
                <Tooltip content="Save" relationship="label">
                    <ToolbarButton icon={<SaveRegular />} onClick={saveTexture} />
                </Tooltip>
            </Toolbar>
        </div>
    );
};
