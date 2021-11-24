import { ICanvasGradient } from 'babylonjs/Engines/ICanvas';
import { StructuredTextMetrics } from './structuredTextMetrics';

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

    fontFamily?: string;
    fontSize?: string;
    fontStyle?: string;
    fontWeight?: string;

    outlineWidth?: number;
    outlineColor?: string;

    shadowColor?: string;
    shadowBlur?: number;
    shadowOffsetX?: number;
    shadowOffsetY?: number;

    // When set, change appearance of that part when the mouse is hovering it.
    // Only property that does not change the metrics should ever be supported here.
    hover?: {
        color?: string | ICanvasGradient;
        underline?: boolean;
    };

    // When set, call observers for a click event
    href?: any;

    // Force splitting this part into one part per character.
    // This is useful for special effects.
    splitIntoCharacters?: boolean;

    // Computed metrics
    metrics?: StructuredTextMetrics;

    // Userland data
    staticCustomData?: object;
    dynamicCustomData?: object;
}
