

interface ISplit {
    setSizes(sizes:Array<number>);
    collapse(index:number);
    destroy();
}


declare function Split (element : Array<HTMLElement> | Array<string>, options:{
    sizes?      : Array<number>, 
    minSize?    : number,
    gutterSize? : number,
    snapOffset? : number,
    direction?  : string
    cursor?     : string
    onDrag?     : Function,
    onDragStart?: Function,
    onDragEnd?  : Function,        
}) : ISplit;
