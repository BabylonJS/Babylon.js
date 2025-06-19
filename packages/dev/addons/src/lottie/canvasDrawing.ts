/* eslint-disable jsdoc/require-jsdoc */

import { type ICanvasRenderingContext } from "core/Engines";
import type { RawPathShape, RawFillShape, RawRectangleShape, RawBezier, RawGradientFillShape, RawGroupShape } from "./types/rawLottie";
import { GetBoundingBox, type BoundingBox } from "./boundingBox";
import { DynamicTexture, type Texture } from "core/Materials";

type GradientStop = {
    offset: number;
    color: string;
};

export type RenderData = {
    boundingBox: BoundingBox;
    texture: Texture;
};

export function DrawGroup(name: string, rawGroup: RawGroupShape): RenderData | undefined {
    // eslint-disable-next-line no-console
    console.log(`Drawing group: ${name}`);

    const boundingBox = GetBoundingBox(rawGroup);

    if (boundingBox.width <= 0 || boundingBox.height <= 0) {
        return undefined;
    }

    const texture = new DynamicTexture(`Texture - ${name}`, { width: boundingBox.width, height: boundingBox.height });
    const ctx = texture.getContext();

    if (!ctx) {
        return undefined;
    }

    ctx.fillStyle = "transparent";
    ctx.fillRect(0, 0, boundingBox.width, boundingBox.height);

    if (rawGroup.it) {
        for (const shape of rawGroup.it) {
            switch (shape.ty) {
                case "rc":
                    DrawRectangle(ctx, shape as RawRectangleShape);
                    break;
                case "sh":
                    DrawPath(ctx, shape as RawPathShape, boundingBox);
                    break;
                case "fl":
                    DrawFill(ctx, shape as RawFillShape);
                    break;
                case "gf":
                    DrawGradientFill(ctx, shape as RawGradientFillShape, boundingBox);
                    break;
                case "tr": // Transform
                    break;
                default:
                    break;
            }
        }
    }

    texture.update();
    return {
        boundingBox,
        texture,
    };
}

function DrawRectangle(ctx: ICanvasRenderingContext, shape: RawRectangleShape): void {
    const size = shape.s.k as number[];
    const radius = shape.r.k as number;

    if (radius <= 0) {
        ctx.rect(0, 0, size[0], size[1]);
    } else {
        ctx.roundRect(0, 0, size[0], size[1], radius);
    }
}

function DrawPath(ctx: ICanvasRenderingContext, shape: RawPathShape, boundingBox: BoundingBox): void {
    const pathData = shape.ks.k as RawBezier;
    const xTranslate = boundingBox.width / 2 - boundingBox.centerX;
    const yTranslate = boundingBox.height / 2 - boundingBox.centerY;

    const vertices = pathData.v;
    const inTangents = pathData.i;
    const outTangents = pathData.o;

    if (vertices.length > 0) {
        ctx.moveTo(vertices[0][0] + xTranslate, vertices[0][1] + yTranslate);

        for (let i = 0; i < vertices.length - 1; i++) {
            const start = vertices[i];
            const end = vertices[i + 1];
            const outTangent = outTangents[i];
            const inTangent = inTangents[i + 1];

            ctx.bezierCurveTo(
                start[0] + xTranslate + outTangent[0],
                start[1] + yTranslate + outTangent[1],
                end[0] + xTranslate + inTangent[0],
                end[1] + yTranslate + inTangent[1],
                end[0] + xTranslate,
                end[1] + yTranslate
            );
        }

        if (pathData.c) {
            // Close path with curve from last to first point
            const start = vertices[vertices.length - 1];
            const end = vertices[0];
            const outTangent = outTangents[vertices.length - 1];
            const inTangent = inTangents[0];

            ctx.bezierCurveTo(
                start[0] + xTranslate + outTangent[0],
                start[1] + yTranslate + outTangent[1],
                end[0] + xTranslate + inTangent[0],
                end[1] + yTranslate + inTangent[1],
                end[0] + xTranslate,
                end[1] + yTranslate
            );

            ctx.closePath();
        }
    }
}

function DrawFill(ctx: ICanvasRenderingContext, fill: RawFillShape): void {
    const color = LottieColorToCSSColor(fill.c.k as number[], (fill.o.k as number) / 100);
    ctx.fillStyle = color;

    ctx.fill();
}

function DrawGradientFill(ctx: ICanvasRenderingContext, fill: RawGradientFillShape, boundingBox: BoundingBox): void {
    switch (fill.t) {
        case 1: {
            DrawLinearGradientFill(ctx, fill, boundingBox);
            break;
        }
        case 2: {
            DrawRadialGradientFill(ctx, fill, boundingBox);
            break;
        }
    }
}

function DrawLinearGradientFill(ctx: ICanvasRenderingContext, fill: RawGradientFillShape, boundingBox: BoundingBox): void {
    const xTranslate = boundingBox.width / 2 - boundingBox.centerX;
    const yTranslate = boundingBox.height / 2 - boundingBox.centerY;

    // Create the gradient
    const startPoint = fill.s.k as number[];
    const endPoint = fill.e.k as number[];
    const gradient = ctx.createLinearGradient(startPoint[0] + xTranslate, startPoint[1] + yTranslate, endPoint[0] + xTranslate, endPoint[1] + yTranslate);

    AddColorStops(gradient, fill);

    ctx.fillStyle = gradient;
    ctx.fill();
}

function DrawRadialGradientFill(ctx: ICanvasRenderingContext, fill: RawGradientFillShape, boundingBox: BoundingBox): void {
    const xTranslate = boundingBox.width / 2 - boundingBox.centerX;
    const yTranslate = boundingBox.height / 2 - boundingBox.centerY;

    // Create the gradient
    const startPoint = fill.s.k as number[];
    const endPoint = fill.e.k as number[];

    const gradient = ctx.createRadialGradient(
        startPoint[0] + xTranslate,
        startPoint[1] + yTranslate,
        0,
        endPoint[0] + xTranslate,
        endPoint[1] + yTranslate,
        Math.hypot(endPoint[0] - startPoint[0], endPoint[1] - startPoint[1]) // End radius
    );

    AddColorStops(gradient, fill);

    ctx.fillStyle = gradient;
    ctx.fill();
}

function AddColorStops(gradient: CanvasGradient, fill: RawGradientFillShape): void {
    const stops = fill.g.p;
    const rawColors = fill.g.k.k;

    let stopsData: GradientStop[] | undefined = undefined;
    if (rawColors.length / stops === 4) {
        stopsData = GradientNoAlphaColorsToCSSColor(rawColors, stops);
    } else if (rawColors.length / stops === 6) {
        stopsData = GradientAlphaColorsToCSSColor(rawColors, stops);
    } else {
        return;
    }

    for (let i = 0; i < stops; i++) {
        gradient.addColorStop(stopsData[i].offset, stopsData[i].color);
    }
}

function GradientNoAlphaColorsToCSSColor(colors: number[], stops: number): GradientStop[] {
    const result: GradientStop[] = [];
    for (let i = 0; i < stops; i++) {
        const index = i * 4;
        result.push({
            offset: colors[index],
            color: LottieColorToCSSColor(colors.slice(index + 1, index + 4), 1),
        });
    }

    return result;
}

function GradientAlphaColorsToCSSColor(colors: number[], stops: number): GradientStop[] {
    const result: GradientStop[] = [];
    for (let i = 0; i < stops; i++) {
        const index = i * 4;
        result.push({
            offset: colors[index],
            color: LottieColorToCSSColor(colors.slice(index, index + 4), 1),
        });
    }

    return result;
}

function LottieColorToCSSColor(color: number[], opacity: number): string {
    if (color.length !== 3 && color.length !== 4) {
        return "rgba(0, 0, 0, 1)"; // Default to black if invalid
    }

    const r = Math.round(color[0] * 255);
    const g = Math.round(color[1] * 255);
    const b = Math.round(color[2] * 255);
    const a = (color[3] || 1) * opacity;

    return `rgba(${r}, ${g}, ${b}, ${a})`;
}
