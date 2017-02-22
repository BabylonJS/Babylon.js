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
        private  static _singleton: CanvasLayoutEngine = null;
        public static get Singleton(): CanvasLayoutEngine {
            if (!CanvasLayoutEngine._singleton) {
                CanvasLayoutEngine._singleton = new CanvasLayoutEngine();
            }
            return CanvasLayoutEngine._singleton;
        } 

        constructor() {
            super();
            this.layoutDirtyOnPropertyChangedMask = Prim2DBase.sizeProperty.flagId | Prim2DBase.actualSizeProperty.flagId;
        }

        // A very simple (no) layout computing...
        // The Canvas and its direct children gets the Canvas' size as Layout Area
        // Indirect children have their Layout Area to the actualSize (margin area) of their parent
        public updateLayout(prim: Prim2DBase) {

            // If this prim is layoutDiry we update  its layoutArea and also the one of its direct children
            if (prim._isFlagSet(SmartPropertyPrim.flagLayoutDirty)) {
                prim._clearFlags(SmartPropertyPrim.flagLayoutDirty);
                for (let child of prim.children) {
                    this._doUpdate(child);
                }
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
                let contentArea = prim.parent.contentArea;

                // Can be null if the parent's content area depend of its children, the computation will be done in many passes
                if (contentArea) {
                    prim.layoutArea = contentArea;
                }
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
            this.layoutDirtyOnPropertyChangedMask = Prim2DBase.sizeProperty.flagId | Prim2DBase.actualSizeProperty.flagId;
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

        private static stackPanelLayoutArea = Size.Zero();
        private static dstOffset = Vector4.Zero();
        private static dstArea = Size.Zero();

        private static computeCounter = 0;

        public updateLayout(prim: Prim2DBase) {
            if (prim._isFlagSet(SmartPropertyPrim.flagLayoutDirty)) {

                let primLayoutArea = prim.layoutArea;
                let isSizeAuto = prim.isSizeAuto;

                // If we're not in autoSize the layoutArea of the prim having the stack panel must be computed in order for us to compute the children' position.
                // If there's at least one auto size (Horizontal or Vertical) we will have to figure the layoutArea ourselves
                if (!primLayoutArea && !isSizeAuto) {
                    return;
                }

//                console.log("Compute Stack Panel Layout " + ++StackPanelLayoutEngine.computeCounter);

                let x = 0;
                let y = 0;
                let horizonStackPanel = this.isHorizontal;

                // If the stack panel is horizontal we check if the primitive height is auto or not, if it's auto then we have to compute the required height, otherwise we just take the actualHeight. If the stack panel is vertical we do the same but with width
                let max = 0;

                let stackPanelLayoutArea = StackPanelLayoutEngine.stackPanelLayoutArea;
                if (horizonStackPanel) {
                    if (prim.isVerticalSizeAuto) {
                        max = 0;
                        stackPanelLayoutArea.height = 0;
                    } else {
                        max = prim.layoutArea.height;
                        stackPanelLayoutArea.height = prim.layoutArea.height;
                        stackPanelLayoutArea.width = 0;
                    }
                } else {
                    if (prim.isHorizontalSizeAuto) {
                        max = 0;
                        stackPanelLayoutArea.width = 0;
                    } else {
                        max = prim.layoutArea.width;
                        stackPanelLayoutArea.width = prim.layoutArea.width;
                        stackPanelLayoutArea.height = 0;
                    }
                }

                for (let child of prim.children) {
                    if (child._isFlagSet(SmartPropertyPrim.flagNoPartOfLayout)) {
                        continue;
                    }

                    if (child._hasMargin) {

                        // Calling computeWithAlignment will return us the area taken by "child" which is its layoutArea
                        // We also have the dstOffset which will give us the y position in horizontal mode or x position in vertical mode.
                        //  The alignment offset on the other axis is simply ignored as it doesn't make any sense (e.g. horizontal alignment is ignored in horizontal mode)
                        child.margin.computeWithAlignment(stackPanelLayoutArea, child.actualSize, child.marginAlignment, child.actualScale, StackPanelLayoutEngine.dstOffset, StackPanelLayoutEngine.dstArea, true);

                        child.layoutArea = StackPanelLayoutEngine.dstArea;

                    } else {
                        child.margin.computeArea(child.actualSize, child.actualScale, StackPanelLayoutEngine.dstArea);
                        child.layoutArea = StackPanelLayoutEngine.dstArea;
                    }

                    max = Math.max(max, horizonStackPanel ? StackPanelLayoutEngine.dstArea.height : StackPanelLayoutEngine.dstArea.width);
                }

                for (let child of prim.children) {
                    if (child._isFlagSet(SmartPropertyPrim.flagNoPartOfLayout)) {
                        continue;
                    }

                    let layoutArea = child.layoutArea;

                    if (horizonStackPanel) {
                        child.layoutAreaPos = new Vector2(x, 0);
                        x += layoutArea.width;
                        child.layoutArea = new Size(layoutArea.width, max);
                    } else {
                        child.layoutAreaPos = new Vector2(0, y);
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

    /**
     * GridData is used specify what row(s) and column(s) a primitive is placed in when its parent is using a Grid Panel Layout. 
     */
    export class GridData implements ILayoutData{

        /**
         * the row number of the grid
         **/
        public row:number;

        /**
         * the column number of the grid 
         **/
        public column:number;

        /**
         * the number of rows a primitive will occupy
         **/
        public rowSpan:number;

        /**
         * the number of columns a primitive will occupy 
         **/
        public columnSpan:number;

        /**
         * Create a Grid Data that describes where a primitive will be placed in a Grid Panel Layout.
         * @param row the row number of the grid
         * @param column the column number of the grid 
         * @param rowSpan the number of rows a primitive will occupy
         * @param columnSpan the number of columns a primitive will occupy 
         **/
        constructor(row:number, column:number, rowSpan?:number, columnSpan?:number){

            this.row = row;
            this.column = column;
            this.rowSpan = (rowSpan == null) ? 1 : rowSpan;
            this.columnSpan = (columnSpan == null) ? 1 : columnSpan;

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
                let w = 1;
                if(i > 0){
                    w = parseFloat(v.substr(0, i));
                }
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

    @className("GridPanelLayoutEngine", "BABYLON")
    /**
     * A grid panel layout.  Grid panel is a table that has rows and columns.
     * When adding children to a primitive that is using grid panel layout, you must assign a GridData object to the child to indicate where the child will appear in the grid.
     */
    export class GridPanelLayoutEngine extends LayoutEngineBase {
        constructor(settings: { rows: [{ height: string }], columns: [{ width: string }] }) {
            super();
            this.layoutDirtyOnPropertyChangedMask = Prim2DBase.sizeProperty.flagId | Prim2DBase.actualSizeProperty.flagId;
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
        private static dstAreaPos = Vector2.Zero();

        public updateLayout(prim: Prim2DBase) {
            if (prim._isFlagSet(SmartPropertyPrim.flagLayoutDirty)) {

                if (!prim.layoutArea) {
                    return;
                }

                for (let child of prim.children) {
                    if (child._isFlagSet(SmartPropertyPrim.flagNoPartOfLayout)) {
                        continue;
                    }
                    if (child._hasMargin) {
                        child.margin.computeWithAlignment(prim.layoutArea, child.actualSize, child.marginAlignment, child.actualScale, GridPanelLayoutEngine.dstOffset, GridPanelLayoutEngine.dstArea, true);
                    } else {
                        child.margin.computeArea(child.actualSize, child.actualScale, GridPanelLayoutEngine.dstArea);
                    }
                    child.layoutArea = GridPanelLayoutEngine.dstArea;
                }

                this._updateGrid(prim);

                let _children = this._children;
                let rl = this._rows.length;
                let cl = this._columns.length;
                let columnWidth = 0;
                let rowHeight = 0;
                let dstArea = GridPanelLayoutEngine.dstArea;
                let dstAreaPos = GridPanelLayoutEngine.dstAreaPos;

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
                                
                                dstArea.width = columnWidth;
                                dstArea.height = rowHeight;

                                child.layoutArea = dstArea;
                                
                                dstAreaPos.x = left;
                                dstAreaPos.y = bottom;

                                child.layoutAreaPos = dstAreaPos;

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

            if(children && children[rowNum]){

                for(let i = 0; i < cl; i++){
                    let child = children[rowNum][i];
                    
                    if(child){
                        let span = (<GridData>child.layoutData).rowSpan;
                        if(maxHeight < child.layoutArea.height/span){
                            maxHeight = child.layoutArea.height/span;
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

            if(children){

                for(let i = 0; i < rl; i++){
                    if(children[i]){
                        let child = children[i][colNum];
                        if(child){
                            let span = (<GridData>child.layoutData).columnSpan;
                            if(maxWidth < child.layoutArea.width/span){
                                maxWidth = child.layoutArea.width/span;
                            }
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

            let childrenThatSpan:Array<Prim2DBase>;

            //add prim.children to _children
            for(let child of prim.children){
                
                if(!child.layoutData){
                    continue;
                }

                let gd = <GridData>child.layoutData;

                if(!_children[gd.row]){
                    _children[gd.row] = [];
                }

                if(gd.columnSpan == 1 && gd.rowSpan == 1){
                    _children[gd.row][gd.column] = child;
                }else{
                    if(!childrenThatSpan){
                        childrenThatSpan = [];
                    }
                    //when children span, we need to add them to _children whereever they span to so that 
                    //_getMaxChildHeightInRow and _getMaxChildWidthInColumn will work correctly.
                    childrenThatSpan.push(child);
                    for(let i = gd.row; i < gd.row + gd.rowSpan; i++){
                        for(let j = gd.column; j < gd.column + gd.columnSpan; j++){
                            _children[i][j] = child;
                        }
                    }
                }

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

                    let maxChildHeight = this._getMaxChildHeightInRow(i);
                    this._rowHeights[i] = Math.max(row.heightPixels, maxChildHeight);
                    rowHeights += this._rowHeights[i];

                }else if(row.heightType == GridDimensionDefinition.Stars){

                    starIndexes.push(i);

                    totalStars += row.height;

                }

            }

            //star row heights

            if(starIndexes.length > 0){

                let remainingHeight = prim.contentArea.height - rowHeights;

                for(let i = 0; i < starIndexes.length; i++){

                    let rowIndex = starIndexes[i];

                    let starHeight = (this._rows[rowIndex].height / totalStars) * remainingHeight;
                    let maxChildHeight = this._getMaxChildHeightInRow(i);

                    this._rowHeights[rowIndex] = Math.max(starHeight, maxChildHeight);

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

                    let maxChildWidth = this._getMaxChildWidthInColumn(i);
                    this._columnWidths[i] = Math.max(column.widthPixels, maxChildWidth);
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

                    let starWidth = (this._columns[columnIndex].width / totalStars) * remainingWidth;
                    let maxChildWidth = this._getMaxChildWidthInColumn(i);

                    this._columnWidths[columnIndex] = Math.max(starWidth, maxChildWidth);

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

            //remove duplicate references to children that span
            if(childrenThatSpan){
                for(var i = 0; i < childrenThatSpan.length; i++){
                    
                    let child = childrenThatSpan[i];
                    let gd = <GridData>child.layoutData;

                    for(let i = gd.row; i < gd.row + gd.rowSpan; i++){
                        for(let j = gd.column; j < gd.column + gd.columnSpan; j++){
                            if(i == gd.row && j == gd.column){
                                continue;
                            }
                            if(_children[i][j] == child){
                                _children[i][j] = null;
                            }
                        }
                    }
                }
            }

        }

    }

}