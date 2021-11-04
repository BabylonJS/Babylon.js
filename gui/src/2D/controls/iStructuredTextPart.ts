import { ICanvasGradient } from 'babylonjs/Engines/ICanvas';

export interface IStructuredTextPart {
    text: string;

    color?: string | ICanvasGradient;

    underline?: boolean;
    lineThrough?: boolean;

    frame?: boolean;
    frameColor?: string;
    frameOutlineWidth?: number;
    frameOutlineColor?: string;
    frameCornerRadius?: number;

    // For instance, font size and family is not updatable, the whole StructuredTextBlock shares the same size and family (not useful and it introduces complexity)
    fontStyle?: string;
    fontWeight?: string;

    outlineWidth?: number;
    outlineColor?: string;

    shadowColor?: string;
    shadowBlur?: number;
    shadowOffsetX?: number;
    shadowOffsetY?: number;

    // Computed part width
    width?: number;
}
