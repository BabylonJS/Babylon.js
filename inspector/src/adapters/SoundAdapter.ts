import { Sound } from "babylonjs";
import { PropertyLine } from "../details/PropertyLine";
import { Helpers } from "../helpers/Helpers";
import { AbstractTreeTool } from "../treetools/AbstractTreeTool";
import { ISoundInteractions, SoundInteractions } from "../treetools/SoundInteractions";
import { Adapter } from "./Adapter";

export class SoundAdapter
    extends Adapter
    implements ISoundInteractions {

    constructor(obj: Sound) {
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
        tools.push(new SoundInteractions(this));
        return tools;
    }

    public setPlaying(callback: Function) {
        if ((this._obj as Sound).isPlaying) {
            (this._obj as Sound).pause();
        }
        else {
            (this._obj as Sound).play();
        }
        (this._obj as Sound).onEndedObservable.addOnce(() => {
            callback();
        });
    }
}
