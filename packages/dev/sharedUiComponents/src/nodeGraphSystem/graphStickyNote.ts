import * as styles from "./graphStickyNote.module.scss";
import { type GraphCanvasComponent } from "./graphCanvas";
import { type IStickyNoteData } from "./interfaces/nodeLocationInfo";

/**
 * Auto-incrementing counter for unique sticky note IDs.
 */
let StickyNoteCounter = 0;

/**
 * A free-floating sticky note annotation on the graph canvas.
 *
 * Sticky notes are lightweight, text-only overlays that live in the frame container.
 * They support dragging, resizing, and inline editing of both title and body text.
 * Unlike frames, they do not group or contain nodes.
 */
export class GraphStickyNote {
    /** The root DOM element for this sticky note. */
    public element: HTMLDivElement;

    private _ownerCanvas: GraphCanvasComponent;
    private _id: number;
    private _x = 0;
    private _y = 0;
    private _width = 180;
    private _height = 120;
    private _name = "Note";
    private _body = "";
    private _color = "rgba(255, 235, 130, 0.92)";

    // DOM
    private _headerElement: HTMLDivElement;
    private _titleElement: HTMLDivElement;
    private _bodyElement: HTMLDivElement;
    private _resizeHandle: HTMLDivElement;

    // Drag state
    private _mouseStartX = 0;
    private _mouseStartY = 0;
    private _isDragging = false;
    private _isResizing = false;
    private _resizeStartW = 0;
    private _resizeStartH = 0;

    /** Unique ID for this sticky note */
    public get id() {
        return this._id;
    }

    /** X position in canvas space */
    public get x() {
        return this._x;
    }

    /** X position in canvas space */
    public set x(value: number) {
        this._x = value;
        this.element.style.left = `${this._ownerCanvas.getGridPosition(value)}px`;
    }

    /** Y position in canvas space */
    public get y() {
        return this._y;
    }

    /** Y position in canvas space */
    public set y(value: number) {
        this._y = value;
        this.element.style.top = `${this._ownerCanvas.getGridPosition(value)}px`;
    }

    /** Width in pixels */
    public get width() {
        return this._width;
    }

    /** Width in pixels */
    public set width(value: number) {
        this._width = Math.max(100, value);
        this.element.style.width = `${this._width}px`;
    }

    /** Height in pixels */
    public get height() {
        return this._height;
    }

    /** Height in pixels */
    public set height(value: number) {
        this._height = Math.max(60, value);
        this.element.style.height = `${this._height}px`;
    }

    /** Display name */
    public get name() {
        return this._name;
    }

    /** Display name */
    public set name(value: string) {
        this._name = value;
        this._titleElement.textContent = value;
    }

    /** Body text content */
    public get body() {
        return this._body;
    }

    /** Body text content */
    public set body(value: string) {
        this._body = value;
        this._bodyElement.textContent = value;
    }

    /** Background color CSS value */
    public get color() {
        return this._color;
    }

    /** Background color CSS value */
    public set color(value: string) {
        this._color = value;
        this.element.style.background = value;
    }

    /**
     * Create a new sticky note on the canvas.
     * @param canvas - the owning graph canvas component
     */
    constructor(canvas: GraphCanvasComponent) {
        this._id = StickyNoteCounter++;
        this._ownerCanvas = canvas;

        const root = canvas.frameContainer;
        const doc = root.ownerDocument;

        // Root element
        this.element = doc.createElement("div");
        this.element.classList.add(styles["sticky-note"]);
        root.appendChild(this.element);

        // Header (drag handle + title + close button)
        this._headerElement = doc.createElement("div");
        this._headerElement.classList.add(styles["sticky-note-header"]);
        this.element.appendChild(this._headerElement);

        this._titleElement = doc.createElement("div");
        this._titleElement.classList.add(styles["sticky-note-title"]);
        this._titleElement.textContent = this._name;
        this._titleElement.contentEditable = "false";
        this._headerElement.appendChild(this._titleElement);

        // Double-click title to edit
        this._titleElement.addEventListener("dblclick", (evt) => {
            evt.stopPropagation();
            this._titleElement.contentEditable = "true";
            this._titleElement.focus();
            // Select all text
            const range = doc.createRange();
            range.selectNodeContents(this._titleElement);
            const sel = doc.defaultView?.getSelection();
            if (sel) {
                sel.removeAllRanges();
                sel.addRange(range);
            }
        });

        this._titleElement.addEventListener("blur", () => {
            this._titleElement.contentEditable = "false";
            this._name = this._titleElement.textContent || "Note";
        });

        this._titleElement.addEventListener("keydown", (evt) => {
            if (evt.key === "Enter") {
                evt.preventDefault();
                this._titleElement.blur();
            }
            evt.stopPropagation();
        });

        // Close button
        const closeBtn = doc.createElement("div");
        closeBtn.classList.add(styles["sticky-note-close"]);
        closeBtn.textContent = "\u00D7"; // ×
        closeBtn.addEventListener("pointerdown", (evt) => {
            evt.stopPropagation();
        });
        closeBtn.addEventListener("click", (evt) => {
            evt.stopPropagation();
            this.dispose();
        });
        this._headerElement.appendChild(closeBtn);

        // Body (editable text area)
        this._bodyElement = doc.createElement("div");
        this._bodyElement.classList.add(styles["sticky-note-body"]);
        this._bodyElement.contentEditable = "true";
        this._bodyElement.textContent = this._body;
        this.element.appendChild(this._bodyElement);

        this._bodyElement.addEventListener("input", () => {
            this._body = this._bodyElement.textContent || "";
        });

        // Stop keyboard events from bubbling while editing body
        this._bodyElement.addEventListener("keydown", (evt) => {
            evt.stopPropagation();
        });

        // Resize handle
        this._resizeHandle = doc.createElement("div");
        this._resizeHandle.classList.add(styles["sticky-note-resize"]);
        this.element.appendChild(this._resizeHandle);

        // --- Event wiring ---

        // Drag via header
        this._headerElement.addEventListener("pointerdown", (evt) => this._onDragStart(evt));

        // Resize via handle
        this._resizeHandle.addEventListener("pointerdown", (evt) => this._onResizeStart(evt));

        // Click to select
        this.element.addEventListener("pointerdown", (evt) => {
            evt.stopPropagation();
            if (!this._ownerCanvas.selectedStickyNotes.includes(this)) {
                this._ownerCanvas.stateManager.onSelectionChangedObservable.notifyObservers({ selection: this });
            }
        });

        // Apply initial dimensions
        this.element.style.width = `${this._width}px`;
        this.element.style.height = `${this._height}px`;
    }

    /**
     * Mark this note as visually selected or deselected.
     * @param selected - whether the note is selected
     */
    public setIsSelected(selected: boolean) {
        if (selected) {
            this.element.classList.add(styles["selected"]);
        } else {
            this.element.classList.remove(styles["selected"]);
        }
    }

    /**
     * Serialize this sticky note to a plain data object.
     * @returns the serialized data
     */
    public serialize(): IStickyNoteData {
        return {
            x: this._x,
            y: this._y,
            width: this._width,
            height: this._height,
            name: this._name,
            body: this._body,
            color: this._color,
        };
    }

    /**
     * Create a sticky note from serialized data.
     * @param data - the serialized sticky note data
     * @param canvas - the owning graph canvas
     * @returns the new sticky note instance
     */
    public static Parse(data: IStickyNoteData, canvas: GraphCanvasComponent): GraphStickyNote {
        const note = new GraphStickyNote(canvas);
        note.x = data.x;
        note.y = data.y;
        note.width = data.width;
        note.height = data.height;
        note.name = data.name;
        note.body = data.body;
        if (data.color) {
            note.color = data.color;
        }
        return note;
    }

    /**
     * Remove this sticky note from the canvas and clean up.
     */
    public dispose() {
        this.element.parentElement?.removeChild(this.element);
        const idx = this._ownerCanvas.stickyNotes.indexOf(this);
        if (idx !== -1) {
            this._ownerCanvas.stickyNotes.splice(idx, 1);
        }
        // Deselect if selected
        const selIdx = this._ownerCanvas.selectedStickyNotes.indexOf(this);
        if (selIdx !== -1) {
            this._ownerCanvas.selectedStickyNotes.splice(selIdx, 1);
        }
        this._ownerCanvas.stateManager.onRebuildRequiredObservable.notifyObservers();
    }

    // --- Drag ---

    private _onDragStart(evt: PointerEvent) {
        // Don't drag if we're editing the title
        if (this._titleElement.contentEditable === "true") {
            return;
        }
        this._isDragging = true;
        this._mouseStartX = evt.clientX;
        this._mouseStartY = evt.clientY;
        this._headerElement.setPointerCapture(evt.pointerId);
        this._headerElement.addEventListener("pointermove", this._onDragMoveHandler);
        this._headerElement.addEventListener("pointerup", this._onDragEndHandler);
        evt.stopPropagation();
    }

    private _onDragMoveHandler = (evt: PointerEvent) => {
        if (!this._isDragging) {
            return;
        }
        const zoom = this._ownerCanvas.zoom;
        const dx = (evt.clientX - this._mouseStartX) / zoom;
        const dy = (evt.clientY - this._mouseStartY) / zoom;
        this._mouseStartX = evt.clientX;
        this._mouseStartY = evt.clientY;
        this.x += dx;
        this.y += dy;
    };

    private _onDragEndHandler = (evt: PointerEvent) => {
        this._isDragging = false;
        this._headerElement.releasePointerCapture(evt.pointerId);
        this._headerElement.removeEventListener("pointermove", this._onDragMoveHandler);
        this._headerElement.removeEventListener("pointerup", this._onDragEndHandler);
    };

    // --- Resize ---

    private _onResizeStart(evt: PointerEvent) {
        this._isResizing = true;
        this._mouseStartX = evt.clientX;
        this._mouseStartY = evt.clientY;
        this._resizeStartW = this._width;
        this._resizeStartH = this._height;
        this._resizeHandle.setPointerCapture(evt.pointerId);
        this._resizeHandle.addEventListener("pointermove", this._onResizeMoveHandler);
        this._resizeHandle.addEventListener("pointerup", this._onResizeEndHandler);
        evt.stopPropagation();
    }

    private _onResizeMoveHandler = (evt: PointerEvent) => {
        if (!this._isResizing) {
            return;
        }
        const zoom = this._ownerCanvas.zoom;
        const dx = (evt.clientX - this._mouseStartX) / zoom;
        const dy = (evt.clientY - this._mouseStartY) / zoom;
        this.width = this._resizeStartW + dx;
        this.height = this._resizeStartH + dy;
    };

    private _onResizeEndHandler = (evt: PointerEvent) => {
        this._isResizing = false;
        this._resizeHandle.releasePointerCapture(evt.pointerId);
        this._resizeHandle.removeEventListener("pointermove", this._onResizeMoveHandler);
        this._resizeHandle.removeEventListener("pointerup", this._onResizeEndHandler);
    };
}
