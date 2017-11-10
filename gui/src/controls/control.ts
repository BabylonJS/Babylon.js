/// <reference path="../../../dist/preview release/babylon.d.ts"/>

module BABYLON.GUI {
    export class Control {       
        private _alpha = 1; 
        private _alphaSet = false; 
        private _zIndex = 0;
        public _root: Nullable<Container>;
        public _host: AdvancedDynamicTexture;
        public parent: Nullable<Container>;
        public _currentMeasure = Measure.Empty();
        private _fontFamily = "Arial";
        private _fontStyle = "";
        private _fontSize = new ValueAndUnit(18, ValueAndUnit.UNITMODE_PIXEL, false);
        private _font: string;
        public _width = new ValueAndUnit(1, ValueAndUnit.UNITMODE_PERCENTAGE, false);
        public _height = new ValueAndUnit(1, ValueAndUnit.UNITMODE_PERCENTAGE, false);
        protected _fontOffset: {ascent: number, height: number, descent: number};
        private _color = "";
        protected _horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
        protected _verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
        private _isDirty = true;
        protected _cachedParentMeasure = Measure.Empty();
        private _paddingLeft = new ValueAndUnit(0);
        private _paddingRight = new ValueAndUnit(0);
        private _paddingTop = new ValueAndUnit(0);
        private _paddingBottom = new ValueAndUnit(0);        
        public _left = new ValueAndUnit(0);
        public _top = new ValueAndUnit(0);
        private _scaleX = 1.0;
        private _scaleY = 1.0;
        private _rotation = 0;
        private _transformCenterX = 0.5;
        private _transformCenterY = 0.5;
        private _transformMatrix = Matrix2D.Identity();
        private _invertTransformMatrix = Matrix2D.Identity();
        private _transformedPosition = Vector2.Zero();
        private _isMatrixDirty = true;
        private _cachedOffsetX: number;
        private _cachedOffsetY: number;
        private _isVisible = true;
        public _linkedMesh: Nullable<AbstractMesh>;
        private _fontSet = false;
        private _dummyVector2 = Vector2.Zero();
        private _downCount = 0;
        private _enterCount = 0;
        private _doNotRender = false;

        public isHitTestVisible = true;
        public isPointerBlocker = false;
        public isFocusInvisible = false;
 
        public shadowOffsetX = 0;
        public shadowOffsetY = 0;
        public shadowBlur = 0;
        public shadowColor = '#000'; 

        protected _linkOffsetX = new ValueAndUnit(0);
        protected _linkOffsetY = new ValueAndUnit(0);
        
        // Properties

        public get typeName(): string {
            return this._getTypeName();
        }

        /**
        * An event triggered when the pointer move over the control.
        * @type {BABYLON.Observable}
        */
        public onPointerMoveObservable = new Observable<Vector2>();

        /**
        * An event triggered when the pointer move out of the control.
        * @type {BABYLON.Observable}
        */
        public onPointerOutObservable = new Observable<Control>();        

        /**
        * An event triggered when the pointer taps the control
        * @type {BABYLON.Observable}
        */
        public onPointerDownObservable = new Observable<Vector2WithInfo>();     

        /**
        * An event triggered when pointer up
        * @type {BABYLON.Observable}
        */
        public onPointerUpObservable = new Observable<Vector2WithInfo>();     

        /**
        * An event triggered when pointer enters the control
        * @type {BABYLON.Observable}
        */
        public onPointerEnterObservable = new Observable<Control>();    

        /**
        * An event triggered when the control is marked as dirty
        * @type {BABYLON.Observable}
        */
        public onDirtyObservable = new Observable<Control>();         
        
         /**
        * An event triggered after the control is drawn
        * @type {BABYLON.Observable}
        */
        public onAfterDrawObservable = new Observable<Control>();    

        public get alpha(): number {
            return this._alpha;
        }

        public set alpha(value: number) {
            if (this._alpha === value) {
                return;
            }
            this._alphaSet = true;
            this._alpha = value;
            this._markAsDirty();
        }                 

        public get scaleX(): number {
            return this._scaleX;
        }

        public set scaleX(value: number) {
            if (this._scaleX === value) {
                return;
            }

            this._scaleX = value;
            this._markAsDirty();
            this._markMatrixAsDirty();
        }     

        public get scaleY(): number {
            return this._scaleY;
        }

        public set scaleY(value: number) {
            if (this._scaleY === value) {
                return;
            }

            this._scaleY = value;
            this._markAsDirty();
            this._markMatrixAsDirty();
        }  

        public get rotation(): number {
            return this._rotation;
        }

        public set rotation(value: number) {
            if (this._rotation === value) {
                return;
            }

            this._rotation = value;
            this._markAsDirty();
            this._markMatrixAsDirty();
        }    

        public get transformCenterY(): number {
            return this._transformCenterY;
        }

        public set transformCenterY(value: number) {
            if (this._transformCenterY === value) {
                return;
            }

            this._transformCenterY = value;
            this._markAsDirty();
            this._markMatrixAsDirty();
        }     

        public get transformCenterX(): number {
            return this._transformCenterX;
        }

        public set transformCenterX(value: number) {
            if (this._transformCenterX === value) {
                return;
            }

            this._transformCenterX = value;
            this._markAsDirty();
            this._markMatrixAsDirty();
        }    

        public get horizontalAlignment(): number {
            return this._horizontalAlignment;
        }

        public set horizontalAlignment(value: number) {
            if (this._horizontalAlignment === value) {
                return;
            }

            this._horizontalAlignment = value;
            this._markAsDirty();
        } 

        public get verticalAlignment(): number {
            return this._verticalAlignment;
        }

        public set verticalAlignment(value: number) {
            if (this._verticalAlignment === value) {
                return;
            }

            this._verticalAlignment = value;
            this._markAsDirty();
        } 

        public get width(): string | number {
            return this._width.toString(this._host);
        }

        public get widthInPixels(): number  {
            return this._width.getValueInPixel(this._host, this._cachedParentMeasure.width);
        }

        public set width(value: string | number ) {
            if (this._width.toString(this._host) === value) {
                return;
            }

            if (this._width.fromString(value)) {
                this._markAsDirty();
            }
        }

        public get height(): string | number  {
            return this._height.toString(this._host);
        }

        public get heightInPixels(): number  {
            return this._height.getValueInPixel(this._host, this._cachedParentMeasure.height);
        }

        public set height(value: string | number ) {
            if (this._height.toString(this._host) === value) {
                return;
            }

            if (this._height.fromString(value)) {
                this._markAsDirty();
            }
        }   

        public get fontFamily(): string {
            return this._fontFamily;
        }

        public set fontFamily(value: string) {
            if (this._fontFamily === value) {
                return;
            }

            this._fontFamily = value;
            this._fontSet = true;
        }

        public get fontStyle(): string {
            return this._fontStyle;
        }

        public set fontStyle(value: string) {
            if (this._fontStyle === value) {
                return;
            }

            this._fontStyle = value;
            this._fontSet = true;
        }     
        
        public get fontSizeInPixels(): number  {
            return this._fontSize.getValueInPixel(this._host, 100);
        }

        public get fontSize(): string | number  {
            return this._fontSize.toString(this._host);
        }

        public set fontSize(value: string | number ) {
            if (this._fontSize.toString(this._host) === value) {
                return;
            }

            if (this._fontSize.fromString(value)) {
                this._markAsDirty();
                this._fontSet = true;
            }
        }

        public get color(): string {
            return this._color;
        }

        public set color(value: string) {
            if (this._color === value) {
                return;
            }

            this._color = value;
            this._markAsDirty();
        }                       

        public get zIndex(): number {
            return this._zIndex;
        }

        public set zIndex(value: number) {
            if (this.zIndex === value) {
                return;
            }

            this._zIndex = value;

            if (this._root) {
                this._root._reOrderControl(this);
            }
        }

        public get notRenderable(): boolean {
            return this._doNotRender;
        }

        public set notRenderable(value: boolean) {
            if (this._doNotRender === value) {
                return;
            }

            this._doNotRender = value;
            this._markAsDirty();
        }

        public get isVisible(): boolean {
            return this._isVisible;
        }

        public set isVisible(value: boolean) {
            if (this._isVisible === value) {
                return;
            }

            this._isVisible = value;
            this._markAsDirty();
        }

        public get isDirty(): boolean {
            return this._isDirty;
        }
        
        public get paddingLeft(): string | number  {
            return this._paddingLeft.toString(this._host);
        }

        public get paddingLeftInPixels(): number  {
            return this._paddingLeft.getValueInPixel(this._host, this._cachedParentMeasure.width);
        }             

        public set paddingLeft(value: string | number ) {
            if (this._paddingLeft.fromString(value)) {
                this._markAsDirty();
            }
        }    

        public get paddingRight(): string | number  {
            return this._paddingRight.toString(this._host);
        }

        public get paddingRightInPixels(): number  {
            return this._paddingRight.getValueInPixel(this._host, this._cachedParentMeasure.width);
        }         

        public set paddingRight(value: string | number ) {
            if (this._paddingRight.fromString(value)) {
                this._markAsDirty();
            }
        }

        public get paddingTop(): string | number  {
            return this._paddingTop.toString(this._host);
        }

        public get paddingTopInPixels(): number  {
            return this._paddingTop.getValueInPixel(this._host, this._cachedParentMeasure.height);
        }         

        public set paddingTop(value: string | number ) {
            if (this._paddingTop.fromString(value)) {
                this._markAsDirty();
            }
        }

        public get paddingBottom(): string | number  {
            return this._paddingBottom.toString(this._host);
        }

        public get paddingBottomInPixels(): number  {
            return this._paddingBottom.getValueInPixel(this._host, this._cachedParentMeasure.height);
        }                 

        public set paddingBottom(value: string | number ) {
            if (this._paddingBottom.fromString(value)) {
                this._markAsDirty();
            }
        }     

        public get left(): string | number  {
            return this._left.toString(this._host);
        }

        public get leftInPixels(): number  {
            return this._left.getValueInPixel(this._host, this._cachedParentMeasure.width);
        }          

        public set left(value: string | number ) {
            if (this._left.fromString(value)) {
                this._markAsDirty();
            }
        }  

        public get top(): string | number  {
            return this._top.toString(this._host);
        }

        public get topInPixels(): number  {
            return this._top.getValueInPixel(this._host, this._cachedParentMeasure.height);
        }        

        public set top(value: string | number ) {
            if (this._top.fromString(value)) {
                this._markAsDirty();
            }
        }     

        public get linkOffsetX(): string | number  {
            return this._linkOffsetX.toString(this._host);
        }

        public get linkOffsetXInPixels(): number  {
            return this._linkOffsetX.getValueInPixel(this._host, this._cachedParentMeasure.width);
        }        

        public set linkOffsetX(value: string | number ) {
            if (this._linkOffsetX.fromString(value)) {
                this._markAsDirty();
            }
        }      

        public get linkOffsetY(): string | number  {
            return this._linkOffsetY.toString(this._host);
        }

        public get linkOffsetYInPixels(): number  {
            return this._linkOffsetY.getValueInPixel(this._host, this._cachedParentMeasure.height);
        }        

        public set linkOffsetY(value: string | number ) {
            if (this._linkOffsetY.fromString(value)) {
                this._markAsDirty();
            }
        }                

        public get centerX(): number {
            return this._currentMeasure.left + this._currentMeasure.width / 2;
        }       

        public get centerY(): number {
            return this._currentMeasure.top + this._currentMeasure.height / 2;
        }                   

        // Functions
        constructor(public name?: string) {
        }

        protected _getTypeName(): string {
            return "Control";
        }

        public getLocalCoordinates(globalCoordinates: Vector2): Vector2 {
            var result = Vector2.Zero();

            this.getLocalCoordinatesToRef(globalCoordinates, result);

            return result;
        }

        public getLocalCoordinatesToRef(globalCoordinates: Vector2, result: Vector2): Control {
            result.x = globalCoordinates.x - this._currentMeasure.left;
            result.y = globalCoordinates.y - this._currentMeasure.top;
            return this;
        }

        public getParentLocalCoordinates(globalCoordinates: Vector2): Vector2 {
            var result = Vector2.Zero();

            result.x = globalCoordinates.x - this._cachedParentMeasure.left;
            result.y = globalCoordinates.y - this._cachedParentMeasure.top;

            return result;
        }
        
        public moveToVector3(position: Vector3, scene: Scene): void {
            if (!this._host || this._root !== this._host._rootContainer) {
                Tools.Error("Cannot move a control to a vector3 if the control is not at root level");
                return;
            }
            
            this.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
            this.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP;

            var globalViewport = this._host._getGlobalViewport(scene);
            var projectedPosition = Vector3.Project(position, Matrix.Identity(), scene.getTransformMatrix(), globalViewport);

            this._moveToProjectedPosition(projectedPosition);

            if (projectedPosition.z < 0 || projectedPosition.z > 1) {
                this.notRenderable = true;
                return;
            }
            this.notRenderable = false;
        }

        public linkWithMesh(mesh: Nullable<AbstractMesh>): void {
            if (!this._host || this._root !== this._host._rootContainer) {
                Tools.Error("Cannot link a control to a mesh if the control is not at root level");
                return;
            }

            var index = this._host._linkedControls.indexOf(this);
            if (index !== -1) {
                this._linkedMesh = mesh;
                if (!mesh) {
                    this._host._linkedControls.splice(index, 1);
                }
                return;
            }

            this.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
            this.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP;
            this._linkedMesh = mesh;
            this._host._linkedControls.push(this);
        }

        public _moveToProjectedPosition(projectedPosition: Vector3): void {
            this.left = ((projectedPosition.x + this._linkOffsetX.getValue(this._host)) - this._currentMeasure.width / 2) + "px";
            this.top = ((projectedPosition.y + this._linkOffsetY.getValue(this._host)) - this._currentMeasure.height / 2) + "px";

            this._left.ignoreAdaptiveScaling = true;
            this._top.ignoreAdaptiveScaling = true;
        }

        public _markMatrixAsDirty(): void {
            this._isMatrixDirty = true;
            this._markAsDirty();
        }

        public _markAsDirty(): void {            
            this._isDirty = true;

            if (!this._host) {
                return; // Not yet connected
            }
            this._host.markAsDirty();
        }

        public _markAllAsDirty(): void {
            this._markAsDirty();

            if (this._font) {
                this._prepareFont();
            }
        }

        public _link(root: Nullable<Container>, host: AdvancedDynamicTexture): void {
            this._root = root;
            this._host = host;
        }

        protected _transform(context: CanvasRenderingContext2D): void {
            if (!this._isMatrixDirty && this._scaleX === 1 && this._scaleY ===1 && this._rotation === 0) {
                return;
            }

            // postTranslate
            var offsetX = this._currentMeasure.width * this._transformCenterX + this._currentMeasure.left;
            var offsetY = this._currentMeasure.height * this._transformCenterY + this._currentMeasure.top;
            context.translate(offsetX, offsetY);

            // rotate
            context.rotate(this._rotation);

            // scale
            context.scale(this._scaleX, this._scaleY);

            // preTranslate
            context.translate(-offsetX, -offsetY);    

            // Need to update matrices?
            if (this._isMatrixDirty || this._cachedOffsetX !== offsetX || this._cachedOffsetY !== offsetY) {
                this._cachedOffsetX = offsetX;
                this._cachedOffsetY = offsetY;
                this._isMatrixDirty = false;

                Matrix2D.ComposeToRef(-offsetX, -offsetY, this._rotation, this._scaleX, this._scaleY, this._root ? this._root._transformMatrix : null, this._transformMatrix);

                this._transformMatrix.invertToRef(this._invertTransformMatrix);
            }
        }

        protected _applyStates(context: CanvasRenderingContext2D): void {
            if (this._fontSet) {
                this._prepareFont();
                this._fontSet = false;
            }

            if (this._font) {
                context.font = this._font;
            }

            if (this._color) {
                context.fillStyle = this._color;
            }

            if (this._alphaSet) {
                context.globalAlpha = this._alpha;
            }
        }

        protected _processMeasures(parentMeasure: Measure, context: CanvasRenderingContext2D): boolean {     
            if (this._isDirty || !this._cachedParentMeasure.isEqualsTo(parentMeasure)) {
                this._isDirty = false;
                this._currentMeasure.copyFrom(parentMeasure);

                // Let children take some pre-measurement actions
                this._preMeasure(parentMeasure, context);

                this._measure();
                this._computeAlignment(parentMeasure, context);

                // Convert to int values
                this._currentMeasure.left = this._currentMeasure.left | 0;
                this._currentMeasure.top = this._currentMeasure.top | 0;
                this._currentMeasure.width = this._currentMeasure.width | 0;
                this._currentMeasure.height = this._currentMeasure.height | 0;

                // Let children add more features
                this._additionalProcessing(parentMeasure, context);

                this._cachedParentMeasure.copyFrom(parentMeasure);

                if (this.onDirtyObservable.hasObservers()) {
                    this.onDirtyObservable.notifyObservers(this);
                }                
            }     

            if (this._currentMeasure.left > parentMeasure.left + parentMeasure.width) {
                return false;
            }

            if (this._currentMeasure.left + this._currentMeasure.width < parentMeasure.left) {
                return false;
            }

            if (this._currentMeasure.top > parentMeasure.top + parentMeasure.height) {
                return false;
            }

            if (this._currentMeasure.top + this._currentMeasure.height < parentMeasure.top) {
                return false;
            }

            // Transform
            this._transform(context); 
                        
            // Clip
            this._clip(context);
            context.clip();

            return true;
        }

        protected _clip( context: CanvasRenderingContext2D) {
            context.beginPath();
            
            if(this.shadowBlur || this.shadowOffsetX || this.shadowOffsetY){
                var shadowOffsetX = this.shadowOffsetX;
                var shadowOffsetY = this.shadowOffsetY;
                var shadowBlur = this.shadowBlur;
                
                var leftShadowOffset = Math.min(Math.min(shadowOffsetX, 0) - shadowBlur*2, 0);
                var rightShadowOffset = Math.max(Math.max(shadowOffsetX, 0) + shadowBlur*2, 0);
                var topShadowOffset = Math.min(Math.min(shadowOffsetY, 0) - shadowBlur*2, 0);
                var bottomShadowOffset = Math.max(Math.max(shadowOffsetY, 0) + shadowBlur*2, 0);

                context.rect(this._currentMeasure.left + leftShadowOffset, 
                            this._currentMeasure.top + topShadowOffset, 
                            this._currentMeasure.width + rightShadowOffset - leftShadowOffset, 
                            this._currentMeasure.height + bottomShadowOffset - topShadowOffset);
            } else {
                context.rect(this._currentMeasure.left ,this._currentMeasure.top, this._currentMeasure.width, this._currentMeasure.height);
            }
        }

        public _measure(): void {  
            // Width / Height
            if (this._width.isPixel) {
                this._currentMeasure.width = this._width.getValue(this._host);
            } else {
                this._currentMeasure.width *= this._width.getValue(this._host); 
            }

            if (this._height.isPixel) {
                this._currentMeasure.height = this._height.getValue(this._host);
            } else {
                this._currentMeasure.height *= this._height.getValue(this._host); 
            }
        }

        protected _computeAlignment(parentMeasure: Measure, context: CanvasRenderingContext2D): void {
            var width = this._currentMeasure.width;
            var height = this._currentMeasure.height;

            var parentWidth = parentMeasure.width;
            var parentHeight = parentMeasure.height;

            // Left / top
            var x = 0;
            var y = 0;

            switch (this.horizontalAlignment) {
                case Control.HORIZONTAL_ALIGNMENT_LEFT:
                    x = 0
                    break;
                case Control.HORIZONTAL_ALIGNMENT_RIGHT:
                    x = parentWidth - width;
                    break;
                case Control.HORIZONTAL_ALIGNMENT_CENTER:
                    x = (parentWidth - width) / 2;
                    break;
            }

            switch (this.verticalAlignment) {
                case Control.VERTICAL_ALIGNMENT_TOP:
                    y = 0;
                    break;
                case Control.VERTICAL_ALIGNMENT_BOTTOM:
                    y = parentHeight - height;
                    break;
                case Control.VERTICAL_ALIGNMENT_CENTER:
                    y = (parentHeight - height) / 2;
                    break;
            }
            
            if (this._paddingLeft.isPixel) {
                this._currentMeasure.left += this._paddingLeft.getValue(this._host);
                this._currentMeasure.width -= this._paddingLeft.getValue(this._host);
            } else {
                this._currentMeasure.left += parentWidth * this._paddingLeft.getValue(this._host);
                this._currentMeasure.width -= parentWidth * this._paddingLeft.getValue(this._host);
            }

            if (this._paddingRight.isPixel) {
                this._currentMeasure.width -= this._paddingRight.getValue(this._host);
            } else {
                this._currentMeasure.width -= parentWidth * this._paddingRight.getValue(this._host);
            }

            if (this._paddingTop.isPixel) {
                this._currentMeasure.top += this._paddingTop.getValue(this._host);
                this._currentMeasure.height -= this._paddingTop.getValue(this._host);
            } else {
                this._currentMeasure.top += parentHeight * this._paddingTop.getValue(this._host);
                this._currentMeasure.height -= parentHeight * this._paddingTop.getValue(this._host);
            }

            if (this._paddingBottom.isPixel) {
                this._currentMeasure.height -= this._paddingBottom.getValue(this._host);
            } else {
                this._currentMeasure.height -= parentHeight * this._paddingBottom.getValue(this._host);
            }            

            if (this._left.isPixel) {
                this._currentMeasure.left += this._left.getValue(this._host);
            } else {
                this._currentMeasure.left += parentWidth * this._left.getValue(this._host);
            }

            if (this._top.isPixel) {
                this._currentMeasure.top += this._top.getValue(this._host);
            } else {
                this._currentMeasure.top += parentHeight * this._top.getValue(this._host);
            }

            this._currentMeasure.left += x;
            this._currentMeasure.top += y;            
        }

        protected _preMeasure(parentMeasure: Measure, context: CanvasRenderingContext2D): void {
            // Do nothing
        }        

        protected _additionalProcessing(parentMeasure: Measure, context: CanvasRenderingContext2D): void {
            // Do nothing
        }

        public _draw(parentMeasure: Measure, context: CanvasRenderingContext2D): void {
            // Do nothing
        }

        public contains(x: number, y: number) : boolean {
            // Invert transform
            this._invertTransformMatrix.transformCoordinates(x, y, this._transformedPosition);

            x = this._transformedPosition.x;
            y = this._transformedPosition.y;

            // Check
            if (x < this._currentMeasure.left) {
                return false;
            }

            if (x > this._currentMeasure.left + this._currentMeasure.width) {
                return false;
            }

            if (y < this._currentMeasure.top) {
                return false;
            }

            if (y > this._currentMeasure.top + this._currentMeasure.height) {
                return false;
            } 

            if (this.isPointerBlocker) {
                this._host._shouldBlockPointer = true;
            }
            return true;
        }

        public _processPicking(x: number, y: number, type: number, buttonIndex: number): boolean {
            if (!this.isHitTestVisible || !this.isVisible || this._doNotRender) {
                return false;
            }

            if (!this.contains(x, y)) {
                return false;
            }

            this._processObservables(type, x, y, buttonIndex);

            return true;
        }

        public _onPointerMove(target: Control, coordinates: Vector2): void {
            var canNotify: boolean = this.onPointerMoveObservable.notifyObservers(coordinates, -1, target, this);

            if (canNotify && this.parent != null) this.parent._onPointerMove(target, coordinates);
        }

        public _onPointerEnter(target: Control): boolean {
            if (this._enterCount !== 0) {
                return false;
            }

            this._enterCount++;

            var canNotify: boolean = this.onPointerEnterObservable.notifyObservers(this, -1, target, this);

            if (canNotify && this.parent != null) this.parent._onPointerEnter(target);

            return true;
        }

        public _onPointerOut(target: Control): void {
            this._enterCount = 0;

            var canNotify: boolean = this.onPointerOutObservable.notifyObservers(this, -1, target, this);

            if (canNotify && this.parent != null) this.parent._onPointerOut(target);
        }

        public _onPointerDown(target: Control, coordinates: Vector2, buttonIndex: number): boolean {
            if (this._downCount !== 0) {
                return false;
            }

            this._downCount++;

            var canNotify: boolean = this.onPointerDownObservable.notifyObservers(new Vector2WithInfo(coordinates, buttonIndex), -1, target, this);

            if (canNotify && this.parent != null) this.parent._onPointerDown(target, coordinates, buttonIndex);

            return true;
        }

        public _onPointerUp(target: Control, coordinates: Vector2, buttonIndex: number): void {
            this._downCount = 0;
            
            var canNotify: boolean = this.onPointerUpObservable.notifyObservers(new Vector2WithInfo(coordinates, buttonIndex), -1, target, this);
            
            if (canNotify && this.parent != null) this.parent._onPointerUp(target, coordinates, buttonIndex);
        }

        public forcePointerUp() {
            this._onPointerUp(this, Vector2.Zero(), 0);
        }

        public _processObservables(type: number, x: number, y: number, buttonIndex: number): boolean {
            this._dummyVector2.copyFromFloats(x, y);
            if (type === BABYLON.PointerEventTypes.POINTERMOVE) {
                this._onPointerMove(this, this._dummyVector2);

                var previousControlOver = this._host._lastControlOver;
                if (previousControlOver && previousControlOver !== this) {
                    previousControlOver._onPointerOut(this);                
                }

                if (previousControlOver !== this) {
                    this._onPointerEnter(this);
                }

                this._host._lastControlOver = this;
                return true;
            }

            if (type === BABYLON.PointerEventTypes.POINTERDOWN) {
                this._onPointerDown(this, this._dummyVector2, buttonIndex);
                this._host._lastControlDown = this;
                this._host._lastPickedControl = this;
                return true;
            }

            if (type === BABYLON.PointerEventTypes.POINTERUP) {
                if (this._host._lastControlDown) {
                    this._host._lastControlDown._onPointerUp(this, this._dummyVector2, buttonIndex);
                }
                this._host._lastControlDown = null;
                return true;
            }
        
            return false;
        }

        private _prepareFont() {
            if (!this._font && !this._fontSet) {
                return;
            }

            this._font = this._fontStyle + " " + this._fontSize.getValue(this._host) + "px " + this._fontFamily;
        
            this._fontOffset = Control._GetFontOffset(this._font);
        }

        public dispose() {
            this.onDirtyObservable.clear();
            this.onAfterDrawObservable.clear();
            this.onPointerDownObservable.clear();
            this.onPointerEnterObservable.clear();
            this.onPointerMoveObservable.clear();
            this.onPointerOutObservable.clear();
            this.onPointerUpObservable.clear();

            if (this._root) {
                this._root.removeControl(this);
                this._root = null;
            }

            var index = this._host._linkedControls.indexOf(this);
            if (index > -1) {
                this.linkWithMesh(null);
            }
        }

        // Statics
        private static _HORIZONTAL_ALIGNMENT_LEFT = 0;
        private static _HORIZONTAL_ALIGNMENT_RIGHT = 1;
        private static _HORIZONTAL_ALIGNMENT_CENTER = 2;
        
        private static _VERTICAL_ALIGNMENT_TOP = 0;
        private static _VERTICAL_ALIGNMENT_BOTTOM = 1;
        private static _VERTICAL_ALIGNMENT_CENTER = 2;

        public static get HORIZONTAL_ALIGNMENT_LEFT(): number {
            return Control._HORIZONTAL_ALIGNMENT_LEFT;
        }

        public static get HORIZONTAL_ALIGNMENT_RIGHT(): number {
            return Control._HORIZONTAL_ALIGNMENT_RIGHT;
        }

        public static get HORIZONTAL_ALIGNMENT_CENTER(): number {
            return Control._HORIZONTAL_ALIGNMENT_CENTER;
        }

        public static get VERTICAL_ALIGNMENT_TOP(): number {
            return Control._VERTICAL_ALIGNMENT_TOP;
        }

        public static get VERTICAL_ALIGNMENT_BOTTOM(): number {
            return Control._VERTICAL_ALIGNMENT_BOTTOM;
        }

        public static get VERTICAL_ALIGNMENT_CENTER(): number {
            return Control._VERTICAL_ALIGNMENT_CENTER;
        }

        private static _FontHeightSizes: {[key: string]: {ascent: number, height: number, descent: number}} = {};

        public static _GetFontOffset(font: string): {ascent: number, height: number, descent: number} {

            if (Control._FontHeightSizes[font]) {
                return Control._FontHeightSizes[font];
            }

            var text = document.createElement("span");
            text.innerHTML = "Hg";
            text.style.font = font;

            var block = document.createElement("div");
            block.style.display = "inline-block";
            block.style.width = "1px";
            block.style.height = "0px";
            block.style.verticalAlign = "bottom";

            var div = document.createElement("div");
            div.appendChild(text);
            div.appendChild(block);

            document.body.appendChild(div);

            var fontAscent = 0;
            var fontHeight = 0;
            try {
                fontHeight = block.getBoundingClientRect().top - text.getBoundingClientRect().top;
                block.style.verticalAlign = "baseline";
                fontAscent = block.getBoundingClientRect().top - text.getBoundingClientRect().top;
            } finally {
                document.body.removeChild(div);
            }
            var result = { ascent: fontAscent, height: fontHeight, descent: fontHeight - fontAscent };
            Control._FontHeightSizes[font] = result;

            return result;
        };

        public static AddHeader(control: Control, text: string, size: string | number, options: { isHorizontal: boolean, controlFirst: boolean }): StackPanel {
            let panel = new BABYLON.GUI.StackPanel("panel");        
            let isHorizontal = options ? options.isHorizontal : true;
            let controlFirst = options ? options.controlFirst : true;
            
            panel.isVertical = !isHorizontal;

            let header = new BABYLON.GUI.TextBlock("header");
            header.text = text;
            header.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
            if (isHorizontal) {
                header.width = size;
            } else {
                header.height = size;
            }

            if (controlFirst) {
                panel.addControl(control);
                panel.addControl(header); 
                header.paddingLeft = "5px";
            } else {
                panel.addControl(header); 
                panel.addControl(control);
                header.paddingRight = "5px";
            }
            
            header.shadowBlur = control.shadowBlur;
            header.shadowColor = control.shadowColor;
            header.shadowOffsetX = control.shadowOffsetX;
            header.shadowOffsetY = control.shadowOffsetY;

            return panel;
        }

        protected static drawEllipse(x:number, y:number, width:number, height:number, context:CanvasRenderingContext2D):void{
            context.translate(x, y);
            context.scale(width, height);

            context.beginPath();
            context.arc(0, 0, 1, 0, 2 * Math.PI);
            context.closePath();

            context.scale(1/width, 1/height);
            context.translate(-x, -y);            
        }
    }    
}
