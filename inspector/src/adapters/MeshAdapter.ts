import { AbstractMesh, Debug, Node, Nullable, Observer, Scene, TransformNode, Vector3 } from "babylonjs";
import { PropertyLine } from "../details/PropertyLine";
import { Helpers } from "../helpers/Helpers";
import { AbstractTreeTool } from "../treetools/AbstractTreeTool";
import { BoundingBox, IToolBoundingBox } from "../treetools/BoundingBox";
import { Checkbox, IToolVisible } from "../treetools/Checkbox";
import { DebugArea, IToolDebug } from "../treetools/DebugArea";
import { Info, IToolInfo } from "../treetools/Info";
import { Adapter } from "./Adapter";

export class MeshAdapter
    extends Adapter
    implements IToolVisible, IToolDebug, IToolBoundingBox, IToolInfo {

    /** Keep track of the axis of the actual object */
    private _axesViewer: Nullable<any>;
    private onBeforeRenderObserver: Nullable<Observer<Scene>>;

    constructor(mesh: Node) {
        super(mesh);
    }

    /** Returns the name displayed in the tree */
    public id(): string {
        let str = '';
        if (this._obj.name) {
            str = this._obj.name;
        } // otherwise nothing displayed
        return str;
    }

    /** Returns the type of this object - displayed in the tree */
    public type(): string {
        return Helpers.GET_TYPE(this._obj);
    }

    /** Returns the list of properties to be displayed for this adapter */
    public getProperties(): Array<PropertyLine> {
        return Helpers.GetAllLinesProperties(this._obj);
    }

    public getTools(): Array<AbstractTreeTool> {
        let tools = [];
        tools.push(new Checkbox(this));
        tools.push(new DebugArea(this));
        if (this._obj instanceof AbstractMesh) {
            if ((this._obj as AbstractMesh).getTotalVertices() > 0) {
                tools.push(new BoundingBox(this));
            }
        }

        tools.push(new Info(this));
        return tools;
    }

    public setVisible(b: boolean) {
        this._obj.setEnabled(b);
        this._obj.isVisible = b;
    }
    public isVisible(): boolean {
        return this._obj.isEnabled() && (this._obj.isVisible === undefined || this._obj.isVisible);
    }
    public isBoxVisible(): boolean {
        return (this._obj as AbstractMesh).showBoundingBox;
    }
    public setBoxVisible(b: boolean) {
        return (this._obj as AbstractMesh).showBoundingBox = b;
    }

    public debug(enable: boolean) {
        // Draw axis the first time
        if (!this._axesViewer) {
            this._drawAxis();
        }
        // Display or hide axis
        if (!enable && this._axesViewer) {
            let mesh = this._obj as AbstractMesh;
            mesh.getScene().onBeforeRenderObservable.remove(this.onBeforeRenderObserver);
            this._axesViewer.dispose();
            this._axesViewer = null;
        }
    }

    /** Returns some information about this mesh */
    public getInfo(): string {
        if (this._obj instanceof AbstractMesh) {
            return `${(this._obj as AbstractMesh).getTotalVertices()} vertices`;
        }
        return '0 vertices';
    }

    /** Draw X, Y and Z axis for the actual object if this adapter.
     * Should be called only one time as it will fill this._axis
     */
    private _drawAxis() {
        this._obj.computeWorldMatrix();

        // Axis
        var x = new Vector3(1, 0, 0);
        var y = new Vector3(0, 1, 0);
        var z = new Vector3(0, 0, 1);

        this._axesViewer = new Debug.AxesViewer(this._obj.getScene());

        let mesh = this._obj as TransformNode;
        this.onBeforeRenderObserver = mesh.getScene().onBeforeRenderObservable.add(() => {
            let matrix = mesh.getWorldMatrix();
            let extend = new Vector3(1, 1, 1);
            if (mesh instanceof AbstractMesh) {
                extend = mesh.getBoundingInfo().boundingBox.extendSizeWorld;
            }
            this._axesViewer!.scaleLines = Math.max(extend.x, extend.y, extend.z) * 2;
            this._axesViewer!.update(this._obj.position, Vector3.TransformNormal(x, matrix), Vector3.TransformNormal(y, matrix), Vector3.TransformNormal(z, matrix));
        });
    }
}
