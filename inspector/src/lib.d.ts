/// <reference path="../../dist/preview release/babylon.d.ts"/>
/// <reference path="babylon.canvas2D.d.ts"/>
/// <reference path="../../dist/preview release/gui/babylon.gui.d.ts"/>

interface ISplit {
    setSizes(sizes:Array<number>);
    collapse(index:number);
    destroy();
}


declare function Split (element : Array<HTMLElement> | Array<string>, options:{
    sizes?      : Array<number>,
    blockDrag?  : boolean, 
    minSize?    : number,
    gutterSize? : number,
    snapOffset? : number,
    direction?  : string
    cursor?     : string
    onDrag?     : Function,
    onDragStart?: Function,
    onDragEnd?  : Function,        
}) : ISplit;