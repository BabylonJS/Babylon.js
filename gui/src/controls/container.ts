/// <reference path="../../../dist/preview release/babylon.d.ts"/>

module BABYLON.GUI {
    export class Container extends Control {
        protected _children = new Array<Control>();
        protected _measureForChildren = Measure.Empty();  
        protected _background: string;   

        public get background(): string {
            return this._background;
        }

        public set background(value: string) {
            if (this._background === value) {
                return;
            }

            this._background = value;
            this._markAsDirty();
        }  

        public get children(): Control[] {
            return this._children;
        }        

        constructor(public name?: string) {
            super(name);
        }

        protected _getTypeName(): string {
            return "Container";
        }           

        public getChildByName(name: string): Nullable<Control> {
            for (var child of this._children) {
                if (child.name === name) {
                    return child;
                }
            }

            return null;
        }       

        public getChildByType(name: string, type: string): Nullable<Control> {
            for (var child of this._children) {
                if (child.typeName === type) {
                    return child;
                }
            }

            return null;
        }            

        public containsControl(control: Control): boolean {
            return this._children.indexOf(control) !== -1;
        }

        public addControl(control: Control): Container {
           var index = this._children.indexOf(control);

            if (index !== -1) {
                return this;
            }
            control._link(this, this._host);

            control._markAllAsDirty();

            this._reOrderControl(control);

            this._markAsDirty();
            return this;
        }

        public removeControl(control: Control): Container {
            var index = this._children.indexOf(control);

            if (index !== -1) {
                this._children.splice(index, 1);

                control.parent = null;
            }

            this._markAsDirty();
            return this;
        }

        public _reOrderControl(control: Control): void {
            this.removeControl(control);

            for (var index = 0; index < this._children.length; index++) {
                if (this._children[index].zIndex > control.zIndex) {
                    this._children.splice(index, 0, control);
                    return;
                }
            }

            this._children.push(control);

            control.parent = this;

            this._markAsDirty();
        }

        public _markMatrixAsDirty(): void {
            super._markMatrixAsDirty();

            for (var index = 0; index < this._children.length; index++) {
                this._children[index]._markMatrixAsDirty();
            }
        }

        public _markAllAsDirty(): void {
            super._markAllAsDirty();

            for (var index = 0; index < this._children.length; index++) {
                this._children[index]._markAllAsDirty();
            }
        }

        protected _localDraw(context: CanvasRenderingContext2D): void {
            if (this._background) {
                if(this.shadowBlur || this.shadowOffsetX || this.shadowOffsetY){
                    context.shadowColor = this.shadowColor;
                    context.shadowBlur = this.shadowBlur;
                    context.shadowOffsetX = this.shadowOffsetX;
                    context.shadowOffsetY = this.shadowOffsetY;
                }
                
                context.fillStyle = this._background;
                context.fillRect(this._currentMeasure.left, this._currentMeasure.top, this._currentMeasure.width, this._currentMeasure.height);
                
                if(this.shadowBlur || this.shadowOffsetX || this.shadowOffsetY){
                    context.shadowBlur = 0;
                    context.shadowOffsetX = 0;
                    context.shadowOffsetY = 0;
                }
            }
        }

        public _link(root: Nullable<Container>, host: AdvancedDynamicTexture): void {
            super._link(root, host);

            for (var child of this._children) {
                child._link(root, host);
            }
        }

        public _draw(parentMeasure: Measure, context: CanvasRenderingContext2D): void {      
            if (!this.isVisible || this.notRenderable) {
                return;
            }
            context.save();
           
            this._applyStates(context);

            if (this._processMeasures(parentMeasure, context)) {
                this._localDraw(context);

                this._clipForChildren(context);
                for (var child of this._children) {
                    if (child.isVisible && !child.notRenderable) {
                        child._draw(this._measureForChildren, context);

                        if (child.onAfterDrawObservable.hasObservers()) {
                            child.onAfterDrawObservable.notifyObservers(child);
                        }
                    }
                }
            }
            context.restore();

            if (this.onAfterDrawObservable.hasObservers()) {
                this.onAfterDrawObservable.notifyObservers(this);
            }
        }

        public _processPicking(x: number, y: number, type: number, buttonIndex: number): boolean {
            if (!this.isVisible || this.notRenderable) {
                return false;
            }

            if (!super.contains(x, y)) {
                return false;
            }

            // Checking backwards to pick closest first
            for (var index = this._children.length - 1; index >= 0; index--) {
                var child = this._children[index];
                if (child._processPicking(x, y, type, buttonIndex)) {
                    return true;
                }
            }

            if (!this.isHitTestVisible) {
                return false;
            }

            return this._processObservables(type, x, y, buttonIndex);
        }

        protected _clipForChildren(context: CanvasRenderingContext2D): void {
            // DO nothing
        }

        protected _additionalProcessing(parentMeasure: Measure, context: CanvasRenderingContext2D): void {  
            super._additionalProcessing(parentMeasure, context);

            this._measureForChildren.copyFrom(this._currentMeasure);
        }

        public dispose() {
            super.dispose();

            for (var control of this._children) {
                control.dispose();
            }
        }
    }    
}