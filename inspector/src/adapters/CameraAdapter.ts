import { Adapter } from "./Adapter";
import { ICameraPOV, CameraPOV } from "../treetools/CameraPOV";
import { Camera } from "babylonjs";
import { Helpers } from "../helpers/Helpers";
import { PropertyLine } from "../details/PropertyLine";
import { AbstractTreeTool } from "treetools/AbstractTreeTool";


export class CameraAdapter
    extends Adapter
    implements ICameraPOV {

    constructor(obj: Camera) {
        super(obj);
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
        tools.push(new CameraPOV(this));
        return tools;
    }

    // Set the point of view of the chosen camera
    public setPOV() {
        (this._obj as Camera).getScene().switchActiveCamera(this._obj);
    }

    // Return the name of the current active camera
    public getCurrentActiveCamera() {
        let activeCamera = (this._obj as Camera).getScene().activeCamera;
        if (activeCamera != null) {
            return activeCamera.name;
        } else {
            return "0";
        }
    }



}