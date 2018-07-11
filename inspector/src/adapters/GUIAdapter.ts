import { Adapter } from "./Adapter";
import { IToolVisible, Checkbox } from "treetools/Checkbox";
import { Helpers } from "helpers/Helpers";
import { PropertyLine } from "details/PropertyLine";
import { AbstractTreeTool } from "treetools/AbstractTreeTool";

import * as GUI from "babylonjs-gui";

export class GUIAdapter
    extends Adapter
    implements IToolVisible {

    constructor(obj: GUI.Control) {
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
        tools.push(new Checkbox(this));
        return tools;
    }

    public setVisible(b: boolean) {
        (this._obj as GUI.Control).isVisible = b;
    }

    public isVisible(): boolean {
        return (this._obj as GUI.Control).isVisible;
    }
}
