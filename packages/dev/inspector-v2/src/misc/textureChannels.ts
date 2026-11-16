/**
 * Defines which channels of a texture to display.
 */
export type TextureChannelsToDisplay = {
    /** True if the red channel should be included. */
    R: boolean;
    /** True if the green channel should be included. */
    G: boolean;
    /** True if the blue channel should be included. */
    B: boolean;
    /** True if the alpha channel should be included. */
    A: boolean;
};

/**
 * Applies the Inspector's channel display rules to RGBA8 pixels in place.
 * @param data The pixel data.
 * @param channels The channels to display.
 * @param pixelCount The number of pixels to process.
 * @internal
 */
export function ApplyTextureChannels(data: Uint8Array, channels: TextureChannelsToDisplay, pixelCount: number): void {
    if (channels.R && channels.G && channels.B && channels.A) {
        return;
    }

    for (let i = 0; i < pixelCount * 4; i += 4) {
        if (channels.A && !channels.R && !channels.G && !channels.B) {
            data[i] = data[i + 3];
            data[i + 1] = data[i + 3];
            data[i + 2] = data[i + 3];
            data[i + 3] = 255;
            continue;
        }
        let r = data[i],
            g = data[i + 1],
            b = data[i + 2],
            a = data[i + 3];
        if (!channels.A) {
            a = 255;
        }
        if (!channels.R) {
            if (channels.G && !channels.B) {
                r = g;
            } else if (channels.B && !channels.G) {
                r = b;
            } else {
                r = 0;
            }
        }
        if (!channels.G) {
            if (channels.R && !channels.B) {
                g = r;
            } else if (channels.B && !channels.R) {
                g = b;
            } else {
                g = 0;
            }
        }
        if (!channels.B) {
            if (channels.R && !channels.G) {
                b = r;
            } else if (channels.G && !channels.R) {
                b = g;
            } else {
                b = 0;
            }
        }
        data[i] = r;
        data[i + 1] = g;
        data[i + 2] = b;
        data[i + 3] = a;
    }
}
