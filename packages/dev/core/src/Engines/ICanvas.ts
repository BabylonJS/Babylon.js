/**
 * Class used to abstract a canvas
 */
export interface ICanvas {
    /**
     * Canvas width.
     */
    width: number;

    /**
     * Canvas height.
     */
    height: number;

    /**
     * returns a drawing context on the canvas.
     * @param contextType context identifier.
     * @param contextAttributes context attributes.
     * @returns ICanvasRenderingContext object.
     */
    getContext(contextType: string, contextAttributes?: any): ICanvasRenderingContext;

    /**
     * returns a data URI containing a representation of the image in the format specified by the type parameter.
     * @param mime the image format.
     * @returns string containing the requested data URI.
     */
    toDataURL(mime: string): string;

    /**
     * Removes the canvas from the document.
     */
    remove(): void;
}

/**
 * Class used to abstract am image to use with the canvas and its context
 */
export interface IImage {
    /**
     * onload callback.
     */
    onload: ((this: GlobalEventHandlers, ev: Event) => any) | null;

    /**
     * Error callback.
     */
    onerror: ((this: GlobalEventHandlers, ev: Event) => any) | null;

    /**
     * Image source.
     */
    src: string;

    /**
     * Image width.
     */
    readonly width: number;

    /**
     * Image height.
     */
    readonly height: number;

    /**
     * The original height of the image resource before sizing.
     */
    readonly naturalHeight: number;

    /**
     * The original width of the image resource before sizing.
     */
    readonly naturalWidth: number;

    /**
     * provides support for CORS, defining how the element handles crossorigin requests,
     * thereby enabling the configuration of the CORS requests for the element's fetched data.
     */
    crossOrigin: string | null;

    /**
     * provides support for referrer policy on xhr load request,
     * it is used to control the request header.
     */
    referrerPolicy: string;
}

/**
 * Class used to abstract a canvas gradient
 */
export interface ICanvasGradient {
    /**
     * adds a new color stop, defined by an offset and a color, to a given canvas gradient.
     * @param offset A number between 0 and 1, inclusive, representing the position of the color stop. 0 represents the start of the gradient and 1 represents the end.
     * @param color value representing the color of the stop.
     */
    addColorStop(offset: number, color: string): void;
}

/**
 * Class used to abstract a text measurement
 */
export interface ITextMetrics {
    /**
     * Text width.
     */
    readonly width: number;
    /**
     * distance (in pixels) parallel to the baseline from the alignment point given by the CanvasRenderingContext2D.textAlign
     * property to the left side of the bounding rectangle of the given text
     */
    readonly actualBoundingBoxLeft: number;
    /**
     * distance (in pixels) parallel to the baseline from the alignment point given by the CanvasRenderingContext2D.textAlign
     * property to the right side of the bounding rectangle of the given text
     */
    readonly actualBoundingBoxRight: number;
}

/**
 * Class used to abstract a matrix
 */
export interface DOMMatrix {
    /**
     * A Boolean flag whose value is true if the matrix was initialized as a 2D matrix. If false, the matrix is 3D.
     */
    is2D: boolean;
    /**
     * A Boolean whose value is true if the matrix is the identity matrix. The identity matrix is one in which every value is 0 except those on the main diagonal from top-left to bottom-right corner (in other words, where the offsets in each direction are equal).
     */
    isIdentity: boolean;
    /**
     * The following double-precision floating-point values represent the components of a matrix which are required in order to perform 2D rotations and translations.
     */
    a: number;
    /**
     * The following double-precision floating-point values represent the components of a matrix which are required in order to perform 2D rotations and translations.
     */
    b: number;
    /**
     * The following double-precision floating-point values represent the components of a matrix which are required in order to perform 2D rotations and translations.
     */
    c: number;
    /**
     * The following double-precision floating-point values represent the components of a matrix which are required in order to perform 2D rotations and translations.
     */
    d: number;
    /**
     * The following double-precision floating-point values represent the components of a matrix which are required in order to perform 2D rotations and translations.
     */
    e: number;
    /**
     * The following double-precision floating-point values represent the components of a matrix which are required in order to perform 2D rotations and translations.
     */
    f: number;
    /**
     * The following are double-precision floating-point values representing each component of a 4×4 matrix, where m11 through m14 are the first column, m21 through m24 are the second column, and so forth.
     */
    m11: number;
    /**
     * The following are double-precision floating-point values representing each component of a 4×4 matrix, where m11 through m14 are the first column, m21 through m24 are the second column, and so forth.
     */
    m12: number;
    /**
     * The following are double-precision floating-point values representing each component of a 4×4 matrix, where m11 through m14 are the first column, m21 through m24 are the second column, and so forth.
     */
    m13: number;
    /**
     * The following are double-precision floating-point values representing each component of a 4×4 matrix, where m11 through m14 are the first column, m21 through m24 are the second column, and so forth.
     */
    m14: number;
    /**
     * The following are double-precision floating-point values representing each component of a 4×4 matrix, where m11 through m14 are the first column, m21 through m24 are the second column, and so forth.
     */
    m21: number;
    /**
     * The following are double-precision floating-point values representing each component of a 4×4 matrix, where m11 through m14 are the first column, m21 through m24 are the second column, and so forth.
     */
    m22: number;
    /**
     * The following are double-precision floating-point values representing each component of a 4×4 matrix, where m11 through m14 are the first column, m21 through m24 are the second column, and so forth.
     */
    m23: number;
    /**
     * The following are double-precision floating-point values representing each component of a 4×4 matrix, where m11 through m14 are the first column, m21 through m24 are the second column, and so forth.
     */
    m24: number;
    /**
     * The following are double-precision floating-point values representing each component of a 4×4 matrix, where m11 through m14 are the first column, m21 through m24 are the second column, and so forth.
     */
    m31: number;
    /**
     * The following are double-precision floating-point values representing each component of a 4×4 matrix, where m11 through m14 are the first column, m21 through m24 are the second column, and so forth.
     */
    m32: number;
    /**
     * The following are double-precision floating-point values representing each component of a 4×4 matrix, where m11 through m14 are the first column, m21 through m24 are the second column, and so forth.
     */
    m33: number;
    /**
     * The following are double-precision floating-point values representing each component of a 4×4 matrix, where m11 through m14 are the first column, m21 through m24 are the second column, and so forth.
     */
    m34: number;
    /**
     * The following are double-precision floating-point values representing each component of a 4×4 matrix, where m11 through m14 are the first column, m21 through m24 are the second column, and so forth.
     */
    m41: number;
    /**
     * The following are double-precision floating-point values representing each component of a 4×4 matrix, where m11 through m14 are the first column, m21 through m24 are the second column, and so forth.
     */
    m42: number;
    /**
     * The following are double-precision floating-point values representing each component of a 4×4 matrix, where m11 through m14 are the first column, m21 through m24 are the second column, and so forth.
     */
    m43: number;
    /**
     * The following are double-precision floating-point values representing each component of a 4×4 matrix, where m11 through m14 are the first column, m21 through m24 are the second column, and so forth.
     */
    m44: number;
}

/**
 * Class used to abstract canvas rendering
 */
export interface ICanvasRenderingContext {
    /**
     * Defines the type of corners where two lines meet. Possible values: round, bevel, miter (default).
     */
    lineJoin: string;

    /**
     * Miter limit ratio. Default 10.
     */
    miterLimit: number;

    /**
     * Font setting. Default value 10px sans-serif.
     */
    font: string;

    /**
     * Color or style to use for the lines around shapes. Default #000 (black).
     */
    strokeStyle: string | ICanvasGradient;

    /**
     * Color or style to use inside shapes. Default #000 (black).
     */
    fillStyle: string | ICanvasGradient;

    /**
     * Alpha value that is applied to shapes and images before they are composited onto the canvas. Default 1.0 (opaque).
     */
    globalAlpha: number;

    /**
     * Color of the shadow. Default: fully-transparent black.
     */
    shadowColor: string;

    /**
     * Specifies the blurring effect. Default: 0.
     */
    shadowBlur: number;

    /**
     * Horizontal distance the shadow will be offset. Default: 0.
     */
    shadowOffsetX: number;

    /**
     * Vertical distance the shadow will be offset. Default: 0.
     */
    shadowOffsetY: number;

    /**
     * Width of lines. Default 1.0.
     */
    lineWidth: number;

    /**
     * canvas is a read-only reference to ICanvas.
     */
    readonly canvas: ICanvas;

    /**
     * Sets all pixels in the rectangle defined by starting point (x, y) and size (width, height) to transparent black, erasing any previously drawn content.
     * @param x The x-axis coordinate of the rectangle's starting point.
     * @param y The y-axis coordinate of the rectangle's starting point.
     * @param width The rectangle's width. Positive values are to the right, and negative to the left.
     * @param height The rectangle's height. Positive values are down, and negative are up.
     */
    clearRect(x: number, y: number, width: number, height: number): void;

    /**
     * Saves the current drawing style state using a stack so you can revert any change you make to it using restore().
     */
    save(): void;

    /**
     * Restores the drawing style state to the last element on the 'state stack' saved by save().
     */
    restore(): void;

    /**
     * Draws a filled rectangle at (x, y) position whose size is determined by width and height.
     * @param x The x-axis coordinate of the rectangle's starting point.
     * @param y The y-axis coordinate of the rectangle's starting point.
     * @param width The rectangle's width. Positive values are to the right, and negative to the left.
     * @param height The rectangle's height. Positive values are down, and negative are up.
     */
    fillRect(x: number, y: number, width: number, height: number): void;

    /**
     * Adds a scaling transformation to the canvas units by x horizontally and by y vertically.
     * @param x Scaling factor in the horizontal direction. A negative value flips pixels across the vertical axis. A value of 1 results in no horizontal scaling.
     * @param y Scaling factor in the vertical direction. A negative value flips pixels across the horizontal axis. A value of 1 results in no vertical scaling.
     */
    scale(x: number, y: number): void;

    /**
     * Adds a rotation to the transformation matrix. The angle argument represents a clockwise rotation angle and is expressed in radians.
     * @param angle The rotation angle, clockwise in radians. You can use degree * Math.PI / 180 to calculate a radian from a degree.
     */
    rotate(angle: number): void;

    /**
     * Adds a translation transformation by moving the canvas and its origin x horizontally and y vertically on the grid.
     * @param x Distance to move in the horizontal direction. Positive values are to the right, and negative to the left.
     * @param y Distance to move in the vertical direction. Positive values are down, and negative are up.
     */
    translate(x: number, y: number): void;

    /**
     * Paints a rectangle which has a starting point at (x, y) and has a w width and an h height onto the canvas, using the current stroke style.
     * @param x The x-axis coordinate of the rectangle's starting point.
     * @param y The y-axis coordinate of the rectangle's starting point.
     * @param width The rectangle's width. Positive values are to the right, and negative to the left.
     * @param height The rectangle's height. Positive values are down, and negative are up.
     */
    strokeRect(x: number, y: number, width: number, height: number): void;

    /**
     * Creates a path for a rectangle at position (x, y) with a size that is determined by width and height.
     * @param x The x-axis coordinate of the rectangle's starting point.
     * @param y The y-axis coordinate of the rectangle's starting point.
     * @param width The rectangle's width. Positive values are to the right, and negative to the left.
     * @param height The rectangle's height. Positive values are down, and negative are up.
     */
    rect(x: number, y: number, width: number, height: number): void;

    /**
     * Creates a clipping path from the current sub-paths. Everything drawn after clip() is called appears inside the clipping path only.
     */
    clip(): void;

    /**
     * Paints data from the given ImageData object onto the bitmap. If a dirty rectangle is provided, only the pixels from that rectangle are painted.
     * @param imageData An ImageData object containing the array of pixel values.
     * @param dx Horizontal position (x coordinate) at which to place the image data in the destination canvas.
     * @param dy Vertical position (y coordinate) at which to place the image data in the destination canvas.
     */
    putImageData(imageData: ImageData, dx: number, dy: number): void;

    /**
     * Adds a circular arc to the current path.
     * @param x The horizontal coordinate of the arc's center.
     * @param y The vertical coordinate of the arc's center.
     * @param radius The arc's radius. Must be positive.
     * @param startAngle The angle at which the arc starts in radians, measured from the positive x-axis.
     * @param endAngle The angle at which the arc ends in radians, measured from the positive x-axis.
     * @param anticlockwise An optional Boolean. If true, draws the arc counter-clockwise between the start and end angles. The default is false (clockwise).
     */
    arc(x: number, y: number, radius: number, startAngle: number, endAngle: number, anticlockwise?: boolean): void;

    /**
     * Starts a new path by emptying the list of sub-paths. Call this method when you want to create a new path.
     */
    beginPath(): void;

    /**
     * Causes the point of the pen to move back to the start of the current sub-path. It tries to draw a straight line from the current point to the start.
     * If the shape has already been closed or has only one point, this function does nothing.
     */
    closePath(): void;

    /**
     * Moves the starting point of a new sub-path to the (x, y) coordinates.
     * @param x The x-axis (horizontal) coordinate of the point.
     * @param y The y-axis (vertical) coordinate of the point.
     */
    moveTo(x: number, y: number): void;

    /**
     * Connects the last point in the current sub-path to the specified (x, y) coordinates with a straight line.
     * @param x The x-axis coordinate of the line's end point.
     * @param y The y-axis coordinate of the line's end point.
     */
    lineTo(x: number, y: number): void;

    /**
     * Adds a quadratic Bézier curve to the current path.
     * @param cpx The x-axis coordinate of the control point.
     * @param cpy The y-axis coordinate of the control point.
     * @param x The x-axis coordinate of the end point.
     * @param y The y-axis coordinate of the end point.
     */
    quadraticCurveTo(cpx: number, cpy: number, x: number, y: number): void;

    /**
     * Returns a TextMetrics object.
     * @param text The text String to measure.
     * @returns ITextMetrics A ITextMetrics object.
     */
    measureText(text: string): ITextMetrics;

    /**
     * Strokes the current sub-paths with the current stroke style.
     */
    stroke(): void;

    /**
     * Fills the current sub-paths with the current fill style.
     */
    fill(): void;

    /**
     * Draws the specified image. This method is available in multiple formats, providing a great deal of flexibility in its use.
     * @param image An element to draw into the context.
     * @param sx The x-axis coordinate of the top left corner of the sub-rectangle of the source image to draw into the destination context.
     * @param sy The y-axis coordinate of the top left corner of the sub-rectangle of the source image to draw into the destination context.
     * @param sWidth The width of the sub-rectangle of the source image to draw into the destination context. If not specified, the entire rectangle from the coordinates specified by sx and sy to the bottom-right corner of the image is used.
     * @param sHeight The height of the sub-rectangle of the source image to draw into the destination context.
     * @param dx The x-axis coordinate in the destination canvas at which to place the top-left corner of the source image.
     * @param dy The y-axis coordinate in the destination canvas at which to place the top-left corner of the source image.
     * @param dWidth The width to draw the image in the destination canvas. This allows scaling of the drawn image. If not specified, the image is not scaled in width when drawn.
     * @param dHeight The height to draw the image in the destination canvas. This allows scaling of the drawn image. If not specified, the image is not scaled in height when drawn.
     */

    drawImage(image: any, sx: number, sy: number, sWidth: number, sHeight: number, dx: number, dy: number, dWidth: number, dHeight: number): void;
    /**
     * Draws the specified image. This method is available in multiple formats, providing a great deal of flexibility in its use.
     * @param image An element to draw into the context.
     * @param dx The x-axis coordinate in the destination canvas at which to place the top-left corner of the source image.
     * @param dy The y-axis coordinate in the destination canvas at which to place the top-left corner of the source image.
     * @param dWidth The width to draw the image in the destination canvas. This allows scaling of the drawn image. If not specified, the image is not scaled in width when drawn.
     * @param dHeight The height to draw the image in the destination canvas. This allows scaling of the drawn image. If not specified, the image is not scaled in height when drawn.
     */
    drawImage(image: any, dx: number, dy: number, dWidth: number, dHeight: number): void;

    /**
     * Draws the specified image. This method is available in multiple formats, providing a great deal of flexibility in its use.
     * @param image An element to draw into the context.
     * @param dx The x-axis coordinate in the destination canvas at which to place the top-left corner of the source image.
     * @param dy The y-axis coordinate in the destination canvas at which to place the top-left corner of the source image.
     */
    drawImage(image: any, dx: number, dy: number): void;

    /**
     * Returns an ImageData object representing the underlying pixel data for the area of the canvas denoted by the rectangle which starts at (sx, sy) and has an sw width and sh height.
     * @param sx The x-axis coordinate of the top-left corner of the rectangle from which the ImageData will be extracted.
     * @param sy The y-axis coordinate of the top-left corner of the rectangle from which the ImageData will be extracted.
     * @param sw The width of the rectangle from which the ImageData will be extracted. Positive values are to the right, and negative to the left.
     * @param sh The height of the rectangle from which the ImageData will be extracted. Positive values are down, and negative are up.
     * @returns ImageData An ImageData object containing the image data for the rectangle of the canvas specified.
     */
    getImageData(sx: number, sy: number, sw: number, sh: number): ImageData;

    /**
     * Sets the current line dash pattern.
     * @param segments An Array of numbers that specify distances to alternately draw a line and a gap (in coordinate space units).
     */
    setLineDash(segments: Array<number>): void;

    /**
     * Draws (fills) a given text at the given (x, y) position.
     * @param text A String specifying the text string to render into the context. The text is rendered using the settings specified by font, textAlign, textBaseline, and direction.
     * @param x The x-axis coordinate of the point at which to begin drawing the text, in pixels.
     * @param y The y-axis coordinate of the baseline on which to begin drawing the text, in pixels.
     * @param maxWidth The maximum number of pixels wide the text may be once rendered. If not specified, there is no limit to the width of the text.
     */
    fillText(text: string, x: number, y: number, maxWidth?: number): void;

    /**
     * Draws (strokes) a given text at the given (x, y) position.
     * @param text A String specifying the text string to render into the context. The text is rendered using the settings specified by font, textAlign, textBaseline, and direction.
     * @param x The x-axis coordinate of the point at which to begin drawing the text, in pixels.
     * @param y The y-axis coordinate of the baseline on which to begin drawing the text, in pixels.
     * @param maxWidth The maximum number of pixels wide the text may be once rendered. If not specified, there is no limit to the width of the text.
     */
    strokeText(text: string, x: number, y: number, maxWidth?: number): void;

    /**
     * Creates a linear gradient along the line given by the coordinates represented by the parameters.
     * @param x0 The x-axis coordinate of the start point.
     * @param y0 The y-axis coordinate of the start point.
     * @param x1 The x-axis coordinate of the end point.
     * @param y1 The y-axis coordinate of the end point.
     * @returns ICanvasGradient A linear ICanvasGradient initialized with the specified line.
     */
    createLinearGradient(x0: number, y0: number, x1: number, y1: number): ICanvasGradient;

    /**
     * Creates a linear gradient along the line given by the coordinates represented by the parameters.
     * @param x0 The x-axis coordinate of the start circle.
     * @param y0 The y-axis coordinate of the start circle.
     * @param r0 The radius of the start circle. Must be non-negative and finite.
     * @param x1 The x-axis coordinate of the end point.
     * @param y1 The y-axis coordinate of the end point.
     * @param r1 The radius of the end circle. Must be non-negative and finite.
     * @returns ICanvasGradient A linear ICanvasGradient initialized with the two specified circles.
     */
    createRadialGradient(x0: number, y0: number, r0: number, x1: number, y1: number, r1: number): ICanvasGradient;

    /**
     * Resets the current transform to matrix composed with a, b, c, d, e, f.
     * @param a Horizontal scaling. A value of 1 results in no scaling.
     * @param b Vertical skewing.
     * @param c Horizontal skewing.
     * @param d Vertical scaling. A value of 1 results in no scaling.
     * @param e Horizontal translation (moving).
     * @param f Vertical translation (moving).
     */
    setTransform(a: number, b: number, c: number, d: number, e: number, f: number): void;

    /**
     * Retrieves the current transformation matrix being applied to the context.
     */
    getTransform(): DOMMatrix;
}
