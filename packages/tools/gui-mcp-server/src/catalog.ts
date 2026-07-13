/* eslint-disable @typescript-eslint/naming-convention */
/**
 * Complete catalog of all Babylon.js GUI 2D control types.
 * Each entry describes the control's class name, category, parent capability,
 * and the properties specific to that control type.
 *
 * This file is the single source of truth that the AI agent uses to know
 * which controls exist and what properties they support.
 */

// ─── Alignment / layout enums ─────────────────────────────────────────────

/** Horizontal alignment values (Control.horizontalAlignment) */
export const HorizontalAlignment = {
    LEFT: 0,
    RIGHT: 1,
    CENTER: 2,
} as const;

/** Vertical alignment values (Control.verticalAlignment) */
export const VerticalAlignment = {
    TOP: 0,
    BOTTOM: 1,
    CENTER: 2,
} as const;

/** Text wrapping modes (TextBlock.textWrapping) */
export const TextWrapping = {
    Clip: 0,
    WordWrap: 1,
    Ellipsis: 2,
    WordWrapEllipsis: 3,
    HTML: 4,
} as const;

/** Image stretch modes (Image.stretch) */
export const ImageStretch = {
    STRETCH_NONE: 0,
    STRETCH_FILL: 1,
    STRETCH_UNIFORM: 2,
    STRETCH_EXTEND: 3,
    STRETCH_NINE_PATCH: 4,
} as const;

// ─── Control-type catalog ─────────────────────────────────────────────────

/**
 * Describes a single property that can be set on a control.
 */
export interface IPropertyInfo {
    /** Human-readable description */
    description: string;
    /** Expected data type */
    type: "string" | "number" | "boolean" | "Color3" | "Color4" | "object";
    /** Default value (informational) */
    defaultValue?: unknown;
}

/**
 * Describes a GUI control type.
 */
export interface IControlTypeInfo {
    /** The Babylon.js class name (used as `className` in serialization) */
    className: string;
    /** Category for grouping */
    category: "Container" | "Text" | "Input" | "Button" | "Indicator" | "Shape" | "Image" | "Layout" | "Misc";
    /** Human-readable description */
    description: string;
    /** Whether this control can contain children */
    isContainer: boolean;
    /** Extra properties specific to this control type (beyond base Control props) */
    properties: Record<string, IPropertyInfo>;
}

/**
 * Base Control properties shared by ALL controls.
 * These are not repeated in each entry below.
 */
export const BaseControlProperties: Record<string, IPropertyInfo> = {
    // Size & position
    width: { description: "Width as a string ('200px', '50%') or number", type: "string", defaultValue: "100%" },
    height: { description: "Height as a string ('40px', '50%') or number", type: "string", defaultValue: "100%" },
    left: { description: "Horizontal offset from alignment anchor", type: "string", defaultValue: "0px" },
    top: { description: "Vertical offset from alignment anchor", type: "string", defaultValue: "0px" },
    // Alignment
    horizontalAlignment: { description: "0 = LEFT, 1 = RIGHT, 2 = CENTER", type: "number", defaultValue: 2 },
    verticalAlignment: { description: "0 = TOP, 1 = BOTTOM, 2 = CENTER", type: "number", defaultValue: 2 },
    // Padding
    paddingLeft: { description: "Left padding (e.g. '10px')", type: "string", defaultValue: "0px" },
    paddingRight: { description: "Right padding", type: "string", defaultValue: "0px" },
    paddingTop: { description: "Top padding", type: "string", defaultValue: "0px" },
    paddingBottom: { description: "Bottom padding", type: "string", defaultValue: "0px" },
    // Appearance
    color: { description: "Foreground / text color (CSS color string)", type: "string", defaultValue: "white" },
    alpha: { description: "Opacity (0 = transparent, 1 = opaque)", type: "number", defaultValue: 1 },
    isVisible: { description: "Whether the control is rendered", type: "boolean", defaultValue: true },
    zIndex: { description: "Rendering order among siblings", type: "number", defaultValue: 0 },
    rotation: { description: "Rotation in radians", type: "number", defaultValue: 0 },
    scaleX: { description: "Horizontal scale factor", type: "number", defaultValue: 1 },
    scaleY: { description: "Vertical scale factor", type: "number", defaultValue: 1 },
    // Font
    fontFamily: { description: "CSS font family", type: "string" },
    fontSize: { description: "Font size (e.g. '24px' or 24)", type: "string", defaultValue: "18px" },
    fontWeight: { description: "CSS font weight (normal, bold, 600, etc.)", type: "string" },
    fontStyle: { description: "CSS font style (normal, italic)", type: "string" },
    // Shadow
    shadowOffsetX: { description: "Shadow X offset", type: "number", defaultValue: 0 },
    shadowOffsetY: { description: "Shadow Y offset", type: "number", defaultValue: 0 },
    shadowBlur: { description: "Shadow blur radius", type: "number", defaultValue: 0 },
    shadowColor: { description: "Shadow color", type: "string", defaultValue: "black" },
    // Behaviour
    isEnabled: { description: "Whether the control accepts input", type: "boolean", defaultValue: true },
    isHitTestVisible: { description: "Whether the control responds to pointer events", type: "boolean", defaultValue: true },
    isPointerBlocker: { description: "Block pointer events from reaching controls behind", type: "boolean", defaultValue: false },
    clipChildren: { description: "Clip child controls to this control's bounds", type: "boolean", defaultValue: true },
    clipContent: { description: "Clip this control's own content to its bounds", type: "boolean", defaultValue: true },
    // Transform
    transformCenterX: { description: "Transform origin X (0–1)", type: "number", defaultValue: 0.5 },
    transformCenterY: { description: "Transform origin Y (0–1)", type: "number", defaultValue: 0.5 },
    fixedRatio: { description: "Lock aspect ratio (0 = off, >0 = width/height ratio)", type: "number", defaultValue: 0 },
};

/**
 * Full catalog of GUI control types.
 * Control is the base class, and LinearGradient/RadialGradient are paint helpers rather than controls.
 */
export const ControlRegistry: Record<string, IControlTypeInfo> = {
    // ─── Containers ───────────────────────────────────────────────────
    Container: {
        className: "Container",
        category: "Container",
        description: "Base container that can hold children. Provides background and child management.",
        isContainer: true,
        properties: {
            background: { description: "Background fill color", type: "string" },
            adaptWidthToChildren: { description: "Auto-resize width to fit children", type: "boolean", defaultValue: false },
            adaptHeightToChildren: { description: "Auto-resize height to fit children", type: "boolean", defaultValue: false },
        },
    },

    Rectangle: {
        className: "Rectangle",
        category: "Container",
        description: "Rectangular container with border and corner radius. The most commonly used container control.",
        isContainer: true,
        properties: {
            background: { description: "Background fill color", type: "string" },
            thickness: { description: "Border thickness in pixels", type: "number", defaultValue: 1 },
            cornerRadius: { description: "Uniform corner radius (all four corners)", type: "number", defaultValue: 0 },
            cornerRadiusX: { description: "Top-left corner radius", type: "number", defaultValue: 0 },
            cornerRadiusY: { description: "Top-right corner radius", type: "number", defaultValue: 0 },
            cornerRadiusZ: { description: "Bottom-left corner radius", type: "number", defaultValue: 0 },
            cornerRadiusW: { description: "Bottom-right corner radius", type: "number", defaultValue: 0 },
            adaptWidthToChildren: { description: "Auto-resize width to fit children", type: "boolean", defaultValue: false },
            adaptHeightToChildren: { description: "Auto-resize height to fit children", type: "boolean", defaultValue: false },
        },
    },

    Ellipse: {
        className: "Ellipse",
        category: "Container",
        description: "Elliptical container with optional border.",
        isContainer: true,
        properties: {
            background: { description: "Background fill color", type: "string" },
            thickness: { description: "Border thickness", type: "number", defaultValue: 1 },
            arc: { description: "Arc ratio (0–1, 1 = full ellipse)", type: "number", defaultValue: 1 },
            adaptWidthToChildren: { description: "Auto-resize width to fit children", type: "boolean", defaultValue: false },
            adaptHeightToChildren: { description: "Auto-resize height to fit children", type: "boolean", defaultValue: false },
        },
    },

    StackPanel: {
        className: "StackPanel",
        category: "Layout",
        description: "Arranges children sequentially in a vertical or horizontal stack. " + "Automatically sizes itself along the stacking axis to fit its children.",
        isContainer: true,
        properties: {
            background: { description: "Background fill color", type: "string" },
            isVertical: { description: "Stack vertically (true) or horizontally (false)", type: "boolean", defaultValue: true },
            spacing: { description: "Pixels of space between each child", type: "number", defaultValue: 0 },
            adaptWidthToChildren: { description: "Auto-resize width to fit children", type: "boolean", defaultValue: false },
            adaptHeightToChildren: { description: "Auto-resize height to fit children", type: "boolean", defaultValue: false },
        },
    },

    Grid: {
        className: "Grid",
        category: "Layout",
        description:
            "Table-like layout that organises children into rows and columns. " +
            "Use add_grid_row / add_grid_column to define the grid structure, " +
            "then add_control with row/column to place controls in cells.",
        isContainer: true,
        properties: {
            background: { description: "Background fill color", type: "string" },
            adaptWidthToChildren: { description: "Auto-resize width to fit children", type: "boolean", defaultValue: false },
            adaptHeightToChildren: { description: "Auto-resize height to fit children", type: "boolean", defaultValue: false },
        },
    },

    ScrollViewer: {
        className: "ScrollViewer",
        category: "Layout",
        description:
            "A scrollable container. Children that exceed the visible area can be scrolled into view. " + "Based on Rectangle, so it supports thickness, cornerRadius, etc.",
        isContainer: true,
        properties: {
            background: { description: "Background fill color", type: "string" },
            thickness: { description: "Border thickness", type: "number", defaultValue: 1 },
            cornerRadius: { description: "Corner radius", type: "number", defaultValue: 0 },
            barColor: { description: "Scrollbar color", type: "string" },
            barBackground: { description: "Scrollbar track color", type: "string" },
            barSize: { description: "Scrollbar width in pixels", type: "number", defaultValue: 20 },
            wheelPrecision: { description: "Mouse wheel scroll precision", type: "number", defaultValue: 3 },
            thumbLength: { description: "Scrollbar thumb minimum length", type: "number" },
        },
    },

    // ─── Text ────────────────────────────────────────────────────────
    TextBlock: {
        className: "TextBlock",
        category: "Text",
        description: "Displays static or dynamic text. Supports word wrap, ellipsis, and text alignment.",
        isContainer: false,
        properties: {
            text: { description: "The text to display", type: "string", defaultValue: "" },
            textWrapping: {
                description: "Wrapping mode: 0=Clip, 1=WordWrap, 2=Ellipsis, 3=WordWrapEllipsis, 4=HTML",
                type: "number",
                defaultValue: 0,
            },
            textHorizontalAlignment: { description: "0=LEFT, 1=RIGHT, 2=CENTER", type: "number", defaultValue: 2 },
            textVerticalAlignment: { description: "0=TOP, 1=BOTTOM, 2=CENTER", type: "number", defaultValue: 2 },
            resizeToFit: { description: "Auto-resize control to fit text content", type: "boolean", defaultValue: false },
            lineSpacing: { description: "Extra spacing between lines (e.g. '5px')", type: "string" },
            outlineWidth: { description: "Text outline thickness", type: "number", defaultValue: 0 },
            outlineColor: { description: "Text outline color", type: "string", defaultValue: "white" },
            underline: { description: "Draw underline", type: "boolean", defaultValue: false },
            lineThrough: { description: "Draw strike-through", type: "boolean", defaultValue: false },
        },
    },

    // ─── Input ────────────────────────────────────────────────────────
    InputText: {
        className: "InputText",
        category: "Input",
        description: "Single-line text input field with placeholder support.",
        isContainer: false,
        properties: {
            text: { description: "Current text value", type: "string", defaultValue: "" },
            placeholderText: { description: "Placeholder text when empty", type: "string", defaultValue: "" },
            placeholderColor: { description: "Placeholder text color", type: "string", defaultValue: "DarkGray" },
            background: { description: "Background fill color", type: "string", defaultValue: "black" },
            focusedBackground: { description: "Background color when focused", type: "string" },
            thickness: { description: "Border thickness", type: "number", defaultValue: 1 },
            margin: { description: "Internal margin (e.g. '10px')", type: "string", defaultValue: "10px" },
            autoStretchWidth: { description: "Auto-resize width to fit text", type: "boolean", defaultValue: true },
            maxWidth: { description: "Maximum width constraint", type: "string" },
            highligherOpacity: { description: "Selection highlight opacity", type: "number", defaultValue: 0.4 },
            textHighlightColor: { description: "Selection highlight color", type: "string", defaultValue: "#d5e0ff" },
            onFocusSelectAll: { description: "Select all text when focused", type: "boolean", defaultValue: false },
        },
    },

    InputPassword: {
        className: "InputPassword",
        category: "Input",
        description: "Password input field. Same as InputText but displays bullet characters.",
        isContainer: false,
        properties: {
            text: { description: "Current text value (hidden by bullets)", type: "string", defaultValue: "" },
            placeholderText: { description: "Placeholder text when empty", type: "string" },
            placeholderColor: { description: "Placeholder text color", type: "string", defaultValue: "DarkGray" },
            background: { description: "Background fill color", type: "string", defaultValue: "black" },
            focusedBackground: { description: "Background color when focused", type: "string" },
            thickness: { description: "Border thickness", type: "number", defaultValue: 1 },
            margin: { description: "Internal margin", type: "string", defaultValue: "10px" },
        },
    },

    InputTextArea: {
        className: "InputTextArea",
        category: "Input",
        description: "Multi-line text input area with optional auto-stretching height.",
        isContainer: false,
        properties: {
            text: { description: "Current text value", type: "string", defaultValue: "" },
            placeholderText: { description: "Placeholder text", type: "string" },
            placeholderColor: { description: "Placeholder color", type: "string", defaultValue: "DarkGray" },
            background: { description: "Background fill color", type: "string", defaultValue: "black" },
            thickness: { description: "Border thickness", type: "number", defaultValue: 1 },
            autoStretchHeight: { description: "Auto-resize height to fit content", type: "boolean", defaultValue: true },
            maxHeight: { description: "Maximum height constraint", type: "string" },
        },
    },

    // ─── Button controls ──────────────────────────────────────────────
    Button: {
        className: "Button",
        category: "Button",
        description:
            "Interactive button. Inherits from Rectangle, so supports thickness, cornerRadius, background. " +
            "Use the 'buttonText' and 'buttonImage' properties (set via set_control_properties) to configure its children.",
        isContainer: true,
        properties: {
            background: { description: "Background fill color", type: "string" },
            thickness: { description: "Border thickness", type: "number", defaultValue: 1 },
            cornerRadius: { description: "Corner radius", type: "number", defaultValue: 0 },
            // The special child properties are managed by the guiManager
        },
    },

    FocusableButton: {
        className: "FocusableButton",
        category: "Button",
        description: "A button that supports keyboard focus / tab navigation. Same visual properties as Button.",
        isContainer: true,
        properties: {
            background: { description: "Background fill color", type: "string" },
            thickness: { description: "Border thickness", type: "number", defaultValue: 1 },
            cornerRadius: { description: "Corner radius", type: "number", defaultValue: 0 },
        },
    },

    ToggleButton: {
        className: "ToggleButton",
        category: "Button",
        description: "A button with on/off toggle state. Inherits from Rectangle.",
        isContainer: true,
        properties: {
            background: { description: "Background fill color", type: "string" },
            thickness: { description: "Border thickness", type: "number", defaultValue: 1 },
            cornerRadius: { description: "Corner radius", type: "number", defaultValue: 0 },
            isActive: { description: "Whether the button is currently in the active/on state", type: "boolean", defaultValue: false },
            group: { description: "Group name for mutual exclusion (like radio buttons)", type: "string" },
        },
    },

    // ─── Indicators / Selectors ───────────────────────────────────────
    Checkbox: {
        className: "Checkbox",
        category: "Indicator",
        description: "A checkbox control with checked/unchecked state.",
        isContainer: false,
        properties: {
            isChecked: { description: "Current checked state", type: "boolean", defaultValue: false },
            background: { description: "Background color of the check area", type: "string", defaultValue: "black" },
            checkSizeRatio: { description: "Size ratio of the check mark (0–1)", type: "number", defaultValue: 0.8 },
            thickness: { description: "Border thickness", type: "number", defaultValue: 1 },
        },
    },

    RadioButton: {
        className: "RadioButton",
        category: "Indicator",
        description: "A radio button control. Use 'group' property to create mutually exclusive sets.",
        isContainer: false,
        properties: {
            isChecked: { description: "Current checked state", type: "boolean", defaultValue: false },
            background: { description: "Background color", type: "string", defaultValue: "black" },
            checkSizeRatio: { description: "Size ratio of the inner circle (0–1)", type: "number", defaultValue: 0.8 },
            thickness: { description: "Border thickness", type: "number", defaultValue: 1 },
            group: { description: "Group name — only one radio button per group can be checked", type: "string" },
        },
    },

    ColorPicker: {
        className: "ColorPicker",
        category: "Indicator",
        description: "A colour picker control that lets the user choose a colour.",
        isContainer: false,
        properties: {
            value: {
                description: "Current colour as {r, g, b} object (0–1 range)",
                type: "object",
                defaultValue: { r: 1, g: 0, b: 0 },
            },
        },
    },

    // ─── Slider controls ──────────────────────────────────────────────
    Slider: {
        className: "Slider",
        category: "Input",
        description: "A slider control for selecting a numeric value within a range.",
        isContainer: false,
        properties: {
            minimum: { description: "Minimum value", type: "number", defaultValue: 0 },
            maximum: { description: "Maximum value", type: "number", defaultValue: 100 },
            value: { description: "Current value", type: "number", defaultValue: 50 },
            step: { description: "Value increment step (0 = continuous)", type: "number", defaultValue: 0 },
            isVertical: { description: "Render vertically", type: "boolean", defaultValue: false },
            displayThumb: { description: "Show the draggable thumb", type: "boolean", defaultValue: true },
            thumbWidth: { description: "Thumb width (e.g. '20px')", type: "string" },
            barOffset: { description: "Bar offset from center (e.g. '5px')", type: "string" },
            isThumbClamped: { description: "Keep thumb within bar bounds", type: "boolean", defaultValue: false },
            background: { description: "Track background color", type: "string", defaultValue: "black" },
            borderColor: { description: "Track border color", type: "string", defaultValue: "white" },
            thumbColor: { description: "Thumb color", type: "string" },
            isThumbCircle: { description: "Render thumb as a circle", type: "boolean", defaultValue: false },
            displayValueBar: { description: "Show value-filled portion of the track", type: "boolean", defaultValue: true },
        },
    },

    ImageBasedSlider: {
        className: "ImageBasedSlider",
        category: "Input",
        description: "A slider that uses custom images for its track and thumb.",
        isContainer: false,
        properties: {
            minimum: { description: "Minimum value", type: "number", defaultValue: 0 },
            maximum: { description: "Maximum value", type: "number", defaultValue: 100 },
            value: { description: "Current value", type: "number", defaultValue: 50 },
            step: { description: "Value step", type: "number", defaultValue: 0 },
            isVertical: { description: "Render vertically", type: "boolean", defaultValue: false },
            displayThumb: { description: "Show thumb", type: "boolean", defaultValue: true },
            backgroundImage: { description: "URL for the track background image", type: "string" },
            valueBarImage: { description: "URL for the value bar image", type: "string" },
            thumbImage: { description: "URL for the thumb image", type: "string" },
        },
    },

    Scrollbar: {
        className: "Scrollbar",
        category: "Input",
        description: "A scrollbar control for selecting a numeric value, commonly used for custom scrolling interfaces.",
        isContainer: false,
        properties: {
            minimum: { description: "Minimum value", type: "number", defaultValue: 0 },
            maximum: { description: "Maximum value", type: "number", defaultValue: 100 },
            value: { description: "Current value", type: "number", defaultValue: 50 },
            step: { description: "Value step", type: "number", defaultValue: 0 },
            isVertical: { description: "Render vertically", type: "boolean", defaultValue: false },
            thumbWidth: { description: "Thumb width (e.g. '20px')", type: "string" },
            background: { description: "Track background color", type: "string", defaultValue: "black" },
            borderColor: { description: "Track border color", type: "string", defaultValue: "white" },
            color: { description: "Thumb color", type: "string" },
            invertScrollDirection: { description: "Invert scroll direction", type: "boolean", defaultValue: false },
        },
    },

    // ImageScrollBar is exported by GUI, but is not registered for GUI serialization, so it is not an MCP-creatable catalog entry.

    // ─── Image ────────────────────────────────────────────────────────
    Image: {
        className: "Image",
        category: "Image",
        description: "Displays an image from a URL. Supports stretching, 9-patch, and sprite sheets.",
        isContainer: false,
        properties: {
            source: { description: "URL of the image to display", type: "string" },
            stretch: {
                description: "Stretch mode: 0=NONE, 1=FILL, 2=UNIFORM, 3=EXTEND, 4=NINE_PATCH",
                type: "number",
                defaultValue: 1,
            },
            autoScale: { description: "Auto-scale image to fit control", type: "boolean", defaultValue: false },
            // 9-patch
            sliceLeft: { description: "9-patch left slice position", type: "number" },
            sliceRight: { description: "9-patch right slice position", type: "number" },
            sliceTop: { description: "9-patch top slice position", type: "number" },
            sliceBottom: { description: "9-patch bottom slice position", type: "number" },
            // Sprite sheet
            cellWidth: { description: "Sprite cell width", type: "number", defaultValue: 0 },
            cellHeight: { description: "Sprite cell height", type: "number", defaultValue: 0 },
            cellId: { description: "Current sprite cell index", type: "number", defaultValue: -1 },
            // Source crop
            sourceLeft: { description: "Source crop X offset", type: "number", defaultValue: 0 },
            sourceTop: { description: "Source crop Y offset", type: "number", defaultValue: 0 },
            sourceWidth: { description: "Source crop width (0 = full image)", type: "number", defaultValue: 0 },
            sourceHeight: { description: "Source crop height (0 = full image)", type: "number", defaultValue: 0 },
            detectPointerOnOpaqueOnly: { description: "Only register pointer events over opaque pixels", type: "boolean", defaultValue: false },
        },
    },

    // ─── Shape controls ───────────────────────────────────────────────
    Line: {
        className: "Line",
        category: "Shape",
        description: "Draws a line between two points.",
        isContainer: false,
        properties: {
            x1: { description: "Start X coordinate", type: "number" },
            y1: { description: "Start Y coordinate", type: "number" },
            x2: { description: "End X coordinate", type: "number" },
            y2: { description: "End Y coordinate", type: "number" },
            lineWidth: { description: "Line thickness", type: "number", defaultValue: 1 },
            dash: { description: "Dash pattern as JSON array e.g. [5, 10]", type: "object" },
        },
    },

    MultiLine: {
        className: "MultiLine",
        category: "Shape",
        description: "Draws a polyline made of multiple connected points.",
        isContainer: false,
        properties: {
            lineWidth: { description: "Line thickness", type: "number", defaultValue: 1 },
            color: { description: "Line color", type: "string", defaultValue: "white" },
            dash: { description: "Dash pattern as JSON array e.g. [5, 10]", type: "object" },
        },
    },

    // ─── Misc ────────────────────────────────────────────────────────
    DisplayGrid: {
        className: "DisplayGrid",
        category: "Misc",
        description: "Renders a visual grid overlay (decorative, not a layout container).",
        isContainer: false,
        properties: {
            cellWidth: { description: "Width of each grid cell", type: "number", defaultValue: 20 },
            cellHeight: { description: "Height of each grid cell", type: "number", defaultValue: 20 },
            minorLineTickness: { description: "Minor grid line thickness", type: "number", defaultValue: 1 },
            minorLineColor: { description: "Minor grid line color", type: "string", defaultValue: "DarkGray" },
            majorLineTickness: { description: "Major grid line thickness", type: "number", defaultValue: 2 },
            majorLineColor: { description: "Major grid line color", type: "string", defaultValue: "white" },
            majorLineFrequency: { description: "Show major line every N cells", type: "number", defaultValue: 5 },
            background: { description: "Background color", type: "string", defaultValue: "Black" },
            displayMajorLines: { description: "Show major lines", type: "boolean", defaultValue: true },
            displayMinorLines: { description: "Show minor lines", type: "boolean", defaultValue: true },
        },
    },

    VirtualKeyboard: {
        className: "VirtualKeyboard",
        category: "Misc",
        description: "On-screen virtual keyboard. Extends StackPanel.",
        isContainer: true,
        properties: {
            background: { description: "Background fill color", type: "string" },
            isVertical: { description: "Stack direction", type: "boolean", defaultValue: true },
            defaultButtonWidth: { description: "Default key width", type: "string" },
            defaultButtonHeight: { description: "Default key height", type: "string" },
            defaultButtonColor: { description: "Default key text color", type: "string" },
            defaultButtonBackground: { description: "Default key background color", type: "string" },
            shiftButtonColor: { description: "Shift key color", type: "string" },
        },
    },
};

// ─── Helpers ──────────────────────────────────────────────────────────────

/**
 * Returns a Markdown-formatted summary of all control types, grouped by category.
 * @returns Markdown string with controls grouped by category
 */
export function GetControlCatalogSummary(): string {
    const byCategory = new Map<string, string[]>();
    for (const [key, info] of Object.entries(ControlRegistry)) {
        const cat = info.category;
        if (!byCategory.has(cat)) {
            byCategory.set(cat, []);
        }
        byCategory.get(cat)!.push(`  ${key}: ${info.description.split(".")[0]}`);
    }

    const sections: string[] = [];
    for (const [cat, entries] of byCategory) {
        sections.push(`## ${cat}\n${entries.join("\n")}`);
    }
    return sections.join("\n\n");
}

/**
 * Returns detailed info for a specific control type, or undefined if not found.
 * @param typeName - the control type name to look up in the registry
 * @returns the control type info, or undefined if not found
 */
export function GetControlTypeDetails(typeName: string): IControlTypeInfo | undefined {
    return ControlRegistry[typeName];
}
