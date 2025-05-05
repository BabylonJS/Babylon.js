import { Vector3 } from "../Maths/math.vector";
import type { Nullable } from "../types";
import type { Scene } from "../scene";
import type { TransformNode } from "../Meshes/transformNode";
import { StandardMaterial } from "../Materials/standardMaterial";
import { AxisDragGizmo } from "../Gizmos/axisDragGizmo";
import { Color3 } from "../Maths/math.color";
import { EngineStore } from "../Engines/engineStore";

/**
 * The Axes viewer will show 3 axes in a specific point in space
 * @see https://doc.babylonjs.com/toolsAndResources/utilities/World_Axes
 */
export class AxesViewer {
    private _xAxis: TransformNode;
    private _yAxis: TransformNode;
    private _zAxis: TransformNode;
    private _scaleLinesFactor = 4;
    private _instanced = false;

    /**
     * Gets the hosting scene
     */
    public scene: Nullable<Scene> = null;

    private _scaleLines = 1;
    /**
     * Gets or sets a number used to scale line length
     */
    public get scaleLines() {
        return this._scaleLines;
    }

    public set scaleLines(value: number) {
        this._scaleLines = value;
        this._xAxis.scaling.setAll(this._scaleLines * this._scaleLinesFactor);
        this._yAxis.scaling.setAll(this._scaleLines * this._scaleLinesFactor);
        this._zAxis.scaling.setAll(this._scaleLines * this._scaleLinesFactor);
    }

    /** Gets the node hierarchy used to render x-axis */
    public get xAxis(): TransformNode {
        return this._xAxis;
    }

    /** Gets the node hierarchy used to render y-axis */
    public get yAxis(): TransformNode {
        return this._yAxis;
    }

    /** Gets the node hierarchy used to render z-axis */
    public get zAxis(): TransformNode {
        return this._zAxis;
    }

    /**
     * Creates a new AxesViewer
     * @param scene defines the hosting scene
     * @param scaleLines defines a number used to scale line length (1 by default)
     * @param renderingGroupId defines a number used to set the renderingGroupId of the meshes (2 by default)
     * @param xAxis defines the node hierarchy used to render the x-axis
     * @param yAxis defines the node hierarchy used to render the y-axis
     * @param zAxis defines the node hierarchy used to render the z-axis
     * @param lineThickness The line thickness to use when creating the arrow. defaults to 1.
     */
    constructor(scene?: Scene, scaleLines = 1, renderingGroupId: Nullable<number> = 2, xAxis?: TransformNode, yAxis?: TransformNode, zAxis?: TransformNode, lineThickness = 1) {
        scene = scene || <Scene>EngineStore.LastCreatedScene;
        if (!scene) {
            return;
        }

        if (!xAxis) {
            const redColoredMaterial = new StandardMaterial("xAxisMaterial", scene);
            redColoredMaterial.disableLighting = true;
            redColoredMaterial.emissiveColor = Color3.Red().scale(0.5);
            xAxis = AxisDragGizmo._CreateArrow(scene, redColoredMaterial, lineThickness);
        }

        if (!yAxis) {
            const greenColoredMaterial = new StandardMaterial("yAxisMaterial", scene);
            greenColoredMaterial.disableLighting = true;
            greenColoredMaterial.emissiveColor = Color3.Green().scale(0.5);
            yAxis = AxisDragGizmo._CreateArrow(scene, greenColoredMaterial, lineThickness);
        }

        if (!zAxis) {
            const blueColoredMaterial = new StandardMaterial("zAxisMaterial", scene);
            blueColoredMaterial.disableLighting = true;
            blueColoredMaterial.emissiveColor = Color3.Blue().scale(0.5);
            zAxis = AxisDragGizmo._CreateArrow(scene, blueColoredMaterial, lineThickness);
        }

        this._xAxis = xAxis;
        this._yAxis = yAxis;
        this._zAxis = zAxis;

        this.scaleLines = scaleLines;

        if (renderingGroupId != null) {
            AxesViewer._SetRenderingGroupId(this._xAxis, renderingGroupId);
            AxesViewer._SetRenderingGroupId(this._yAxis, renderingGroupId);
            AxesViewer._SetRenderingGroupId(this._zAxis, renderingGroupId);
        }

        this.scene = scene;
        this.update(new Vector3(), Vector3.Right(), Vector3.Up(), Vector3.Forward());
    }

    /**
     * Force the viewer to update
     * @param position defines the position of the viewer
     * @param xaxis defines the x axis of the viewer
     * @param yaxis defines the y axis of the viewer
     * @param zaxis defines the z axis of the viewer
     */
    public update(position: Vector3, xaxis: Vector3, yaxis: Vector3, zaxis: Vector3): void {
        this._xAxis.position.copyFrom(position);
        this._xAxis.setDirection(xaxis);

        this._yAxis.position.copyFrom(position);
        this._yAxis.setDirection(yaxis);

        this._zAxis.position.copyFrom(position);
        this._zAxis.setDirection(zaxis);
    }

    /**
     * Creates an instance of this axes viewer.
     * @returns a new axes viewer with instanced meshes
     */
    public createInstance(): AxesViewer {
        const xAxis = AxisDragGizmo._CreateArrowInstance(this.scene!, this._xAxis);
        const yAxis = AxisDragGizmo._CreateArrowInstance(this.scene!, this._yAxis);
        const zAxis = AxisDragGizmo._CreateArrowInstance(this.scene!, this._zAxis);
        const axesViewer = new AxesViewer(this.scene!, this.scaleLines, null, xAxis, yAxis, zAxis);
        axesViewer._instanced = true;
        return axesViewer;
    }

    /** Releases resources */
    public dispose() {
        if (this._xAxis) {
            this._xAxis.dispose(false, !this._instanced);
        }

        if (this._yAxis) {
            this._yAxis.dispose(false, !this._instanced);
        }

        if (this._zAxis) {
            this._zAxis.dispose(false, !this._instanced);
        }

        this.scene = null;
    }

    private static _SetRenderingGroupId(node: TransformNode, id: number) {
        const meshes = node.getChildMeshes();
        for (const mesh of meshes) {
            mesh.renderingGroupId = id;
        }
    }
}
