import * as React from "react";
import * as styles from "./graphMinimap.module.scss";
import { type GraphCanvasComponent } from "./graphCanvas";

/**
 * Props for the GraphMinimapComponent.
 * This component can be reused by any editor that uses GraphCanvasComponent.
 */
export interface IGraphMinimapComponentProps {
    /** The graph canvas to visualize */
    canvas: GraphCanvasComponent;
    /** How long (ms) the minimap stays visible after the last interaction. Default 1500. */
    hideDelayMs?: number;
    /** Width of the minimap in pixels. Default 200. */
    width?: number;
    /** Height of the minimap in pixels. Default 140. */
    height?: number;
}

/**
 * A minimap overlay that shows a scaled-down overview of the node graph.
 * It appears when the user zooms or pans and auto-hides after a delay.
 * Clicking/dragging on the minimap pans the canvas to that position.
 *
 * This is a reusable component that works with any GraphCanvasComponent-based editor
 * (Flow Graph Editor, Node Material Editor, Node Geometry Editor, etc.).
 */
export class GraphMinimapComponent extends React.Component<IGraphMinimapComponentProps> {
    private _canvasRef = React.createRef<HTMLCanvasElement>();
    private _containerRef = React.createRef<HTMLDivElement>();
    private _rafId = 0;
    private _hideTimer: ReturnType<typeof setTimeout> | null = null;
    private _visible = false;
    private _isDragging = false;
    /** Track last canvas state to detect changes driven by external APIs (zoomToFit, etc.) */
    private _lastX = 0;
    private _lastY = 0;
    private _lastZoom = 1;
    /** Stored transform values for minimap hit-testing */
    private _mapScale = 1;
    private _mapOffsetX = 0;
    private _mapOffsetY = 0;
    private _mapTotalMinX = 0;
    private _mapTotalMinY = 0;

    private get _hideDelay() {
        return this.props.hideDelayMs ?? 1500;
    }

    private get _width() {
        return this.props.width ?? 200;
    }

    private get _height() {
        return this.props.height ?? 140;
    }

    /** @internal */
    override componentDidMount() {
        this._rafId = requestAnimationFrame(this._tick);
    }

    /** @internal */
    override componentWillUnmount() {
        cancelAnimationFrame(this._rafId);
        if (this._hideTimer) {
            clearTimeout(this._hideTimer);
        }
    }

    /**
     * Show the minimap and schedule auto-hide.
     */
    private _show() {
        if (!this._visible) {
            this._visible = true;
            this._applyVisibility();
        }
        // Reset hide timer
        if (this._hideTimer) {
            clearTimeout(this._hideTimer);
        }
        this._hideTimer = setTimeout(() => {
            if (!this._isDragging) {
                this._visible = false;
                this._applyVisibility();
            }
        }, this._hideDelay);
    }

    private _applyVisibility() {
        const container = this._containerRef.current;
        if (!container) {
            return;
        }
        if (this._visible) {
            container.classList.remove(styles["minimap-hidden"]);
            container.classList.add(styles["minimap-visible"]);
        } else {
            container.classList.remove(styles["minimap-visible"]);
            container.classList.add(styles["minimap-hidden"]);
        }
    }

    /**
     * Main render loop — polls the canvas state every frame and redraws
     * the minimap when a change is detected.
     */
    private _tick = () => {
        const canvas = this.props.canvas;
        const { x, y, zoom } = canvas;

        if (x !== this._lastX || y !== this._lastY || zoom !== this._lastZoom) {
            this._lastX = x;
            this._lastY = y;
            this._lastZoom = zoom;
            this._show();
            this._draw();
        }

        this._rafId = requestAnimationFrame(this._tick);
    };

    /**
     * Compute the bounding box of all nodes and frames in graph-space.
     * @returns the min/max coordinates of the graph content
     */
    private _computeGraphBounds() {
        const canvas = this.props.canvas;
        const nodes = canvas.nodes;
        const frames = canvas.frames;
        const stickyNotes = canvas.stickyNotes;

        if (nodes.length === 0 && frames.length === 0 && stickyNotes.length === 0) {
            return { minX: 0, minY: 0, maxX: 1000, maxY: 700 };
        }

        let minX = Infinity;
        let minY = Infinity;
        let maxX = -Infinity;
        let maxY = -Infinity;

        for (const node of nodes) {
            const nx = node.x;
            const ny = node.y;
            const nw = node.width || 200;
            const nh = node.height || 40;
            if (nx < minX) {
                minX = nx;
            }
            if (ny < minY) {
                minY = ny;
            }
            if (nx + nw > maxX) {
                maxX = nx + nw;
            }
            if (ny + nh > maxY) {
                maxY = ny + nh;
            }
        }

        for (const frame of frames) {
            const fx = frame.x;
            const fy = frame.y;
            const fw = frame.width || 200;
            const fh = frame.height || 100;
            if (fx < minX) {
                minX = fx;
            }
            if (fy < minY) {
                minY = fy;
            }
            if (fx + fw > maxX) {
                maxX = fx + fw;
            }
            if (fy + fh > maxY) {
                maxY = fy + fh;
            }
        }

        for (const note of stickyNotes) {
            const sx = note.x;
            const sy = note.y;
            const sw = note.width || 180;
            const sh = note.height || 120;
            if (sx < minX) {
                minX = sx;
            }
            if (sy < minY) {
                minY = sy;
            }
            if (sx + sw > maxX) {
                maxX = sx + sw;
            }
            if (sy + sh > maxY) {
                maxY = sy + sh;
            }
        }

        // Pad the bounds a bit so nodes aren't right at the edge
        const pad = 100;
        return { minX: minX - pad, minY: minY - pad, maxX: maxX + pad, maxY: maxY + pad };
    }

    /**
     * Draw the minimap onto the <canvas> element.
     */
    private _draw() {
        const el = this._canvasRef.current;
        if (!el) {
            return;
        }

        const ctx = el.getContext("2d");
        if (!ctx) {
            return;
        }

        const canvas = this.props.canvas;
        const dpr = window.devicePixelRatio || 1;
        const w = this._width;
        const h = this._height;

        // Ensure backing store matches CSS size
        if (el.width !== w * dpr || el.height !== h * dpr) {
            el.width = w * dpr;
            el.height = h * dpr;
        }
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, w, h);

        // Compute graph bounds
        const bounds = this._computeGraphBounds();

        // Also include the viewport in the bounds so scrolling far from nodes
        // still makes sense.
        const vpLeftInGraph = -canvas.x / canvas.zoom;
        const vpTopInGraph = -canvas.y / canvas.zoom;
        const hostRect = (canvas as any)._hostCanvas?.getBoundingClientRect();
        const vpW = (hostRect?.width ?? 800) / canvas.zoom;
        const vpH = (hostRect?.height ?? 600) / canvas.zoom;

        const totalMinX = Math.min(bounds.minX, vpLeftInGraph);
        const totalMinY = Math.min(bounds.minY, vpTopInGraph);
        const totalMaxX = Math.max(bounds.maxX, vpLeftInGraph + vpW);
        const totalMaxY = Math.max(bounds.maxY, vpTopInGraph + vpH);
        const totalW = totalMaxX - totalMinX;
        const totalH = totalMaxY - totalMinY;

        // Scale to fit the minimap
        const scale = Math.min(w / totalW, h / totalH);
        // Center the content
        const offsetX = (w - totalW * scale) / 2;
        const offsetY = (h - totalH * scale) / 2;

        const toMiniX = (gx: number) => (gx - totalMinX) * scale + offsetX;
        const toMiniY = (gy: number) => (gy - totalMinY) * scale + offsetY;

        // Draw frames
        for (const frame of canvas.frames) {
            const fx = toMiniX(frame.x);
            const fy = toMiniY(frame.y);
            const fw = (frame.width || 200) * scale;
            const fh = (frame.height || 100) * scale;
            ctx.fillStyle = "rgba(100, 100, 100, 0.3)";
            ctx.strokeStyle = "rgba(150, 150, 150, 0.5)";
            ctx.lineWidth = 0.5;
            ctx.fillRect(fx, fy, fw, fh);
            ctx.strokeRect(fx, fy, fw, fh);
        }

        // Draw nodes
        const selectedSet = new Set(canvas.selectedNodes);
        for (const node of canvas.nodes) {
            const nx = toMiniX(node.x);
            const ny = toMiniY(node.y);
            const nw = Math.max((node.width || 200) * scale, 2);
            const nh = Math.max((node.height || 40) * scale, 1.5);
            ctx.fillStyle = selectedSet.has(node) ? "#5da0e0" : "#888";
            ctx.fillRect(nx, ny, nw, nh);
        }

        // Draw sticky notes
        for (const note of canvas.stickyNotes) {
            const snx = toMiniX(note.x);
            const sny = toMiniY(note.y);
            const snw = (note.width || 180) * scale;
            const snh = (note.height || 120) * scale;
            ctx.fillStyle = "rgba(255, 235, 130, 0.5)";
            ctx.fillRect(snx, sny, snw, snh);
        }

        // Draw viewport rectangle
        const vx = toMiniX(vpLeftInGraph);
        const vy = toMiniY(vpTopInGraph);
        const vw = vpW * scale;
        const vh = vpH * scale;
        ctx.strokeStyle = "rgba(255, 255, 255, 0.7)";
        ctx.lineWidth = 1.5;
        ctx.strokeRect(vx, vy, vw, vh);

        // Store transform for hit-testing in pointer events
        this._mapScale = scale;
        this._mapOffsetX = offsetX;
        this._mapOffsetY = offsetY;
        this._mapTotalMinX = totalMinX;
        this._mapTotalMinY = totalMinY;
    }

    /**
     * Convert a pointer event on the minimap to graph-space coordinates and
     * pan the canvas to center on that point.
     * @param evt - the pointer event from the minimap
     */
    private _panToMinimapPoint(evt: React.PointerEvent) {
        const el = this._canvasRef.current;
        if (!el) {
            return;
        }
        const rect = el.getBoundingClientRect();
        const localX = evt.clientX - rect.left;
        const localY = evt.clientY - rect.top;

        // Convert minimap pixel to graph-space
        const graphX = (localX - this._mapOffsetX) / this._mapScale + this._mapTotalMinX;
        const graphY = (localY - this._mapOffsetY) / this._mapScale + this._mapTotalMinY;

        // Center the viewport on this graph point
        const canvas = this.props.canvas;
        const hostRect = (canvas as any)._hostCanvas?.getBoundingClientRect();
        const vpW = (hostRect?.width ?? 800) / canvas.zoom;
        const vpH = (hostRect?.height ?? 600) / canvas.zoom;

        canvas.x = -(graphX - vpW / 2) * canvas.zoom;
        canvas.y = -(graphY - vpH / 2) * canvas.zoom;
    }

    private _onPointerDown = (evt: React.PointerEvent) => {
        evt.preventDefault();
        evt.stopPropagation();
        this._isDragging = true;
        (evt.target as HTMLElement).setPointerCapture(evt.pointerId);
        this._panToMinimapPoint(evt);
    };

    private _onPointerMove = (evt: React.PointerEvent) => {
        if (!this._isDragging) {
            return;
        }
        evt.preventDefault();
        evt.stopPropagation();
        this._panToMinimapPoint(evt);
    };

    private _onPointerUp = (evt: React.PointerEvent) => {
        if (!this._isDragging) {
            return;
        }
        this._isDragging = false;
        (evt.target as HTMLElement).releasePointerCapture(evt.pointerId);
        // Re-arm the hide timer
        this._show();
    };

    /** @internal */
    override render() {
        return (
            <div
                ref={this._containerRef}
                className={`${styles["minimap-container"]} ${styles["minimap-hidden"]}`}
                style={{ width: this._width, height: this._height }}
                onPointerDown={this._onPointerDown}
                onPointerMove={this._onPointerMove}
                onPointerUp={this._onPointerUp}
            >
                <canvas ref={this._canvasRef} className={styles["minimap-canvas"]} style={{ width: this._width, height: this._height }} />
            </div>
        );
    }
}
