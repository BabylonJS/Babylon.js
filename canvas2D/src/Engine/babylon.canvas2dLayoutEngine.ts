module BABYLON {

    export interface ILayoutData {
        
    }

    @className("LayoutEngineBase", "BABYLON")
    /**
     * This is the base class you have to extend in order to implement your own Layout Engine.
     * Note that for performance reason, each different Layout Engine type can be exposed as one/many singleton or must be instanced each time.
     * If data has to be associated to a given primitive you can use the SmartPropertyPrim.addExternalData API to do it.
     */
    export class LayoutEngineBase implements ILockable {
        constructor() {
            this.layoutDirtyOnPropertyChangedMask = 0;
        }

        public newChild(child: Prim2DBase, data: ILayoutData) {
            
        }

        public updateLayout(prim: Prim2DBase) {
        }

        public get isChildPositionAllowed(): boolean {
            return false;
        }

        isLocked(): boolean {
            return this._isLocked;
        }

        lock(): boolean {
            if (this._isLocked) {
                return false;
            }
            this._isLocked = true;
            return true;
        }

        public layoutDirtyOnPropertyChangedMask;

        private _isLocked: boolean;
    }

    @className("CanvasLayoutEngine", "BABYLON")
    /**
     * The default Layout Engine, primitive are positioning into a Canvas, using their x/y coordinates.
     * This layout must be used as a Singleton through the CanvasLayoutEngine.Singleton property.
     */
    export class CanvasLayoutEngine extends LayoutEngineBase {
        public static Singleton: CanvasLayoutEngine = new CanvasLayoutEngine();

        // A very simple (no) layout computing...
        // The Canvas and its direct children gets the Canvas' size as Layout Area
        // Indirect children have their Layout Area to the actualSize (margin area) of their parent
        public updateLayout(prim: Prim2DBase) {

            // If this prim is layoutDiry we update  its layoutArea and also the one of its direct children
            if (prim._isFlagSet(SmartPropertyPrim.flagLayoutDirty)) {

                for (let child of prim.children) {
                    this._doUpdate(child);
                }
                prim._clearFlags(SmartPropertyPrim.flagLayoutDirty);
            }

        }

        private _doUpdate(prim: Prim2DBase) {
            // Canvas ?
            if (prim instanceof Canvas2D) {
                prim.layoutArea = prim.actualSize; //.multiplyByFloats(prim.scaleX, prim.scaleY);
            }

            // Direct child of Canvas ?
            else if (prim.parent instanceof Canvas2D) {
                prim.layoutArea = prim.owner.actualSize; //.multiplyByFloats(prim.owner.scaleX, prim.owner.scaleY);
            }

            // Indirect child of Canvas
            else {
                prim.layoutArea = prim.parent.contentArea;
            }
        }

        get isChildPositionAllowed(): boolean {
            return true;
        }
    }


    @className("StackPanelLayoutEngine", "BABYLON")
    /**
     * A stack panel layout. Primitive will be stack either horizontally or vertically.
     * This Layout type must be used as a Singleton, use the StackPanelLayoutEngine.Horizontal for an horizontal stack panel or StackPanelLayoutEngine.Vertical for a vertical one.
     */
    export class StackPanelLayoutEngine extends LayoutEngineBase {
        constructor() {
            super();
            this.layoutDirtyOnPropertyChangedMask = Prim2DBase.sizeProperty.flagId;
        }

        public static get Horizontal(): StackPanelLayoutEngine {
            if (!StackPanelLayoutEngine._horizontal) {
                StackPanelLayoutEngine._horizontal = new StackPanelLayoutEngine();
                StackPanelLayoutEngine._horizontal.isHorizontal = true;
                StackPanelLayoutEngine._horizontal.lock();
            }

            return StackPanelLayoutEngine._horizontal;
        }

        public static get Vertical(): StackPanelLayoutEngine {
            if (!StackPanelLayoutEngine._vertical) {
                StackPanelLayoutEngine._vertical = new StackPanelLayoutEngine();
                StackPanelLayoutEngine._vertical.isHorizontal = false;
                StackPanelLayoutEngine._vertical.lock();
            }

            return StackPanelLayoutEngine._vertical;
        }
        private static _horizontal: StackPanelLayoutEngine = null;
        private static _vertical: StackPanelLayoutEngine = null;


        get isHorizontal(): boolean {
            return this._isHorizontal;
        }

        set isHorizontal(val: boolean) {
            if (this.isLocked()) {
                return;
            }
            this._isHorizontal = val;
        }

        private _isHorizontal: boolean = true;

        private static dstOffset = Vector4.Zero();
        private static dstArea = Size.Zero();

        public updateLayout(prim: Prim2DBase) {
            if (prim._isFlagSet(SmartPropertyPrim.flagLayoutDirty)) {

                let x = 0;
                let y = 0;
                let h = this.isHorizontal;
                let max = 0;

                for (let child of prim.children) {
                    if (child._isFlagSet(SmartPropertyPrim.flagNoPartOfLayout)) {
                        continue;
                    }
                    let layoutArea: Size;
                    if (child._hasMargin) {
                        child.margin.computeWithAlignment(prim.layoutArea, child.actualSize, child.marginAlignment, StackPanelLayoutEngine.dstOffset, StackPanelLayoutEngine.dstArea, true);
                        layoutArea = StackPanelLayoutEngine.dstArea.clone();
                        child.layoutArea = layoutArea;
                    } else {
                        layoutArea = child.layoutArea;
                        child.margin.computeArea(child.actualSize, layoutArea);
                    }

                    max = Math.max(max, h ? layoutArea.height : layoutArea.width);

                }

                for (let child of prim.children) {
                    if (child._isFlagSet(SmartPropertyPrim.flagNoPartOfLayout)) {
                        continue;
                    }
                    child.layoutAreaPos = new Vector2(x, y);

                    let layoutArea = child.layoutArea;

                    if (h) {
                        x += layoutArea.width;
                        child.layoutArea = new Size(layoutArea.width, max);
                    } else {
                        y += layoutArea.height;
                        child.layoutArea = new Size(max, layoutArea.height);
                    }
                }
                prim._clearFlags(SmartPropertyPrim.flagLayoutDirty);
            }

        }

        get isChildPositionAllowed(): boolean {
            return false;
        }
    }


    export class GridData implements ILayoutData{

        row:number;
        column:number;
        rowSpan:number;
        columnSpan:number;

        constructor(row:number, column:number, rowSpan:number, columnSpan:number){

            this.row = row;
            this.column = column;

            this.rowSpan = rowSpan === null ? 1 : rowSpan;
            this.columnSpan = columnSpan === null ? 1 : columnSpan;

        }

    }

    class GridDimensionDefinition {
        public static Pixels = 1;
        public static Stars = 2;
        public static Auto = 3;
        _parse(value: string, res: (v: number, vp: number, t: number) => void) {
            let v = value.toLocaleLowerCase().trim();
            if (v.indexOf("auto") === 0) {
                res(null, null, GridDimensionDefinition.Auto);
            } else if (v.indexOf("*") !== -1) {
                let i = v.indexOf("*");
                let w = parseFloat(v.substr(0, i));
                res(w, null, GridDimensionDefinition.Stars);
            } else {
                let w = parseFloat(v);
                res(w, w, GridDimensionDefinition.Pixels);
            }
        }
    }
    class RowDefinition extends GridDimensionDefinition {
        heightPixels: number;
        height: number;
        heightType: number;
    }
    class ColumnDefinition extends GridDimensionDefinition {
        widthPixels: number;
        width: number;
        widthType: number;
    }

    @className("GridPanelLayoutEngine")
    export class GridPanelLayoutEngine extends LayoutEngineBase {
        constructor(settings: { rows: [{ height: string }], columns: [{ width: string }] }) {
            super();
            this.layoutDirtyOnPropertyChangedMask = Prim2DBase.sizeProperty.flagId;
            this._rows = new Array<RowDefinition>();
            this._columns = new Array<ColumnDefinition>();
            if (settings.rows) {
                for (let row of settings.rows) {
                    let r = new RowDefinition();
                    r._parse(row.height, (v, vp, t) => {
                        r.height = v;
                        r.heightPixels = vp;
                        r.heightType = t;
                    });
                    this._rows.push(r);
                }
            }
            if (settings.columns) {
                for (let col of settings.columns) {
                    let r = new ColumnDefinition();
                    r._parse(col.width, (v, vp, t) => {
                        r.width = v;
                        r.widthPixels = vp;
                        r.widthType = t;
                    });
                    this._columns.push(r);
                }
            }

        }

        private _rows: Array<RowDefinition>;
        private _columns: Array<ColumnDefinition>;
        private _children: Prim2DBase[][] = [];
        
        private _rowBottoms: Array<number> = [];
        private _columnLefts: Array<number> = [];

        private _rowHeights: Array<number> = [];
        private _columnWidths: Array<number> = [];

        private static dstOffset = Vector4.Zero();
        private static dstArea = Size.Zero();

        public updateLayout(prim: Prim2DBase) {
            if (prim._isFlagSet(SmartPropertyPrim.flagLayoutDirty)) {
                
                for (let child of prim.children) {
                    if (child._isFlagSet(SmartPropertyPrim.flagNoPartOfLayout)) {
                        continue;
                    }
                    let layoutArea: Size;
                    if (child._hasMargin) {
                        child.margin.computeWithAlignment(prim.layoutArea, child.actualSize, child.marginAlignment, GridPanelLayoutEngine.dstOffset, GridPanelLayoutEngine.dstArea, true);
                        layoutArea = GridPanelLayoutEngine.dstArea.clone();
                        child.layoutArea = layoutArea;
                    } else {
                        layoutArea = child.layoutArea;
                        child.margin.computeArea(child.actualSize, layoutArea);
                    }
                }

                let _children = this._children;

                this._updateGrid(prim);

                let rl = this._rows.length;
                let cl = this._columns.length;

                let offsetX = 0;
                let offsetY = 0;

                let columnWidth = 0;
                let rowHeight = 0;
                
                for(let i = 0; i < _children.length; i++){
                    let children = _children[i];

                    if(children){

                        let bottom = this._rowBottoms[i];
                        let rowHeight = this._rowHeights[i];

                        let oBottom = bottom;
                        let oRowHeight = rowHeight;

                        for(let j = 0; j < children.length; j++){
                            
                            let left = this._columnLefts[j];
                            let columnWidth = this._columnWidths[j];

                            let child = children[j];

                            if(child){

                                let gd = <GridData>child.layoutData;

                                if(gd.columnSpan > 1){
                                    for(let k = j+1; k < gd.columnSpan + j && k < cl; k++){
                                        columnWidth += this._columnWidths[k];
                                    }
                                }

                                if(gd.rowSpan > 1){
                                    
                                    for(let k = i+1; k < gd.rowSpan + i && k < rl; k++){
                                        rowHeight += this._rowHeights[k];
                                        bottom = this._rowBottoms[k];
                                    }
                                    
                                }

                                if(child.marginAlignment.horizontal === PrimitiveAlignment.AlignRight){
                                    offsetX = columnWidth - child.actualWidth;
                                }else if(child.marginAlignment.horizontal === PrimitiveAlignment.AlignCenter){
                                    offsetX = columnWidth*.5 - child.actualWidth*.5;
                                }else{
                                    offsetX = 0;
                                }

                                if(child.marginAlignment.vertical === PrimitiveAlignment.AlignTop){
                                    offsetY = rowHeight - child.actualHeight;
                                }else if(child.marginAlignment.vertical === PrimitiveAlignment.AlignCenter){
                                    offsetY = rowHeight*.5 - child.actualHeight*.5;
                                }else{
                                    offsetY = 0;
                                }

                                child.layoutAreaPos.x = left + offsetX;
                                child.layoutAreaPos.y = bottom + offsetY;

                                bottom = oBottom;
                                rowHeight = oRowHeight;
                                
                            }

                        }

                    }
                    
                }

                prim._clearFlags(SmartPropertyPrim.flagLayoutDirty);
            }
        }

        get isChildPositionAllowed(): boolean {
            return false;
        }

        private _getMaxChildHeightInRow(rowNum:number):number{

            let rows = this._rows;
            let cl = this._columns.length;
            let rl = this._rows.length;
            let children = this._children;
            let row = rows[rowNum];
            
            let maxHeight = 0;

            if(children){

                for(let i = 0; i < cl; i++){
                    let child = children[rowNum][i];
                    if(child){
                        if(maxHeight < child.actualHeight){
                            maxHeight = child.actualHeight;
                        }
                    }
                }

            }

            return maxHeight;

        }

        private _getMaxChildWidthInColumn(colNum:number):number{

            let columns = this._columns;
            let cl = this._columns.length;
            let rl = this._rows.length;
            let children = this._children;
            let column = columns[colNum];
            let maxWidth = 0;

            maxWidth = 0;

            if(children){

                for(let i = 0; i < rl; i++){
                    let child = children[i][colNum];
                    if(child){
                        if(maxWidth < child.actualWidth){
                            maxWidth = child.actualWidth;
                        }
                    }
                }

            }

            return maxWidth;

        }

        private _updateGrid(prim:Prim2DBase){

            let _children = this._children;

            //remove prim.children from _children
            for(let i = 0; i < _children.length; i++){
                let children = _children[i];
                if(children){
                    children.length = 0;
                }
            }

            //add prim.children to _children
            for(let child of prim.children){
                
                if(!child.layoutData || !child.parent){
                    continue;
                }

                let gd = <GridData>child.layoutData;

                if(!_children[gd.row]){
                    _children[gd.row] = [];
                }

                _children[gd.row][gd.column] = child;

            }


            let rows = this._rows;
            let columns = this._columns;

            let rl = this._rows.length;
            let cl = this._columns.length;

            //get fixed and auto row heights first

            var starIndexes = [];
            var totalStars = 0;
            var rowHeights = 0;
            let columnWidths = 0;

            for (let i = 0; i < rl; i++) {

                let row = this._rows[i];

                if(row.heightType == GridDimensionDefinition.Auto){

                    this._rowHeights[i] = this._getMaxChildHeightInRow(i);
                    rowHeights += this._rowHeights[i];

                }else if(row.heightType == GridDimensionDefinition.Pixels){

                    this._rowHeights[i] = row.heightPixels;
                    rowHeights += this._rowHeights[i];

                }else if(row.heightType == GridDimensionDefinition.Stars){

                    starIndexes.push(i);

                    totalStars += row.height;

                }

            }

            //star row heights

            if(starIndexes.length > 0){

                let remainingHeight = prim.contentArea.width - rowHeights;

                for(let i = 0; i < starIndexes.length; i++){

                    let rowIndex = starIndexes[i];

                    this._rowHeights[rowIndex] = (this._rows[rowIndex].height / totalStars) * remainingHeight;

                }
            }


            //get fixed and auto column widths

            starIndexes.length = 0;
            totalStars = 0;

            for (let i = 0; i < cl; i++) {

                let column = this._columns[i];

                if(column.widthType == GridDimensionDefinition.Auto){

                    this._columnWidths[i] = this._getMaxChildWidthInColumn(i);
                    columnWidths += this._columnWidths[i];

                }else if(column.widthType == GridDimensionDefinition.Pixels){

                    this._columnWidths[i] = column.widthPixels;
                    columnWidths += this._columnWidths[i];

                }else if(column.widthType == GridDimensionDefinition.Stars){

                    starIndexes.push(i);

                    totalStars += column.width;

                }

            }

            //star column widths

            if(starIndexes.length > 0){

                let remainingWidth = prim.contentArea.width - columnWidths;

                for(let i = 0; i < starIndexes.length; i++){

                    let columnIndex = starIndexes[i];

                    this._columnWidths[columnIndex] = (this._columns[columnIndex].width / totalStars) * remainingWidth;

                }
            }


            let y = 0;
            this._rowBottoms[rl - 1] = y;

            for (let i = rl - 2; i >= 0; i--) {

                y += this._rowHeights[i+1];
                this._rowBottoms[i] = y;

            }

            let x = 0;
            this._columnLefts[0] = x;
            
            for (let i = 1; i < cl; i++) {

                x += this._columnWidths[i-1];
                this._columnLefts[i] = x;

            }

        }

    }

}