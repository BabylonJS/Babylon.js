module BABYLON {
    export class SwitchBooleanAction extends Action {
        private _target: any;
        private _effectiveTarget: any;
        private _property: string;

        constructor(triggerOptions: any, target: any, public propertyPath: string, condition?: Condition) {
            super(triggerOptions, condition);
            this._target = this._effectiveTarget = target;
        }

        public _prepare(): void {
            this._effectiveTarget = this._getEffectiveTarget(this._effectiveTarget, this.propertyPath);
            this._property = this._getProperty(this.propertyPath);
        }

        public execute(): void {
            this._effectiveTarget[this._property] = !this._effectiveTarget[this._property];
        }
        
        public serialize(parent: any): any {
            return super._serialize({
                name: "SwitchBooleanAction",
                properties: [
                    Action._GetTargetProperty(this._target),
                    { name: "propertyPath", value: this.propertyPath }
                ]
            }, parent);
        }
    }

    export class SetStateAction extends Action {
        private _target: any;

        constructor(triggerOptions: any, target: any, public value: string, condition?: Condition) {
            super(triggerOptions, condition);
            this._target = target;
        }

        public execute(): void {
            this._target.state = this.value;
        }
        
        public serialize(parent: any): any {
            return super._serialize({
                name: "SetStateAction",
                properties: [
                    Action._GetTargetProperty(this._target),
                    { name: "value", value: this.value }
                ]
            }, parent);
        }
    }

    export class SetValueAction extends Action {
        private _target: any;
        private _effectiveTarget: any;
        private _property: string;

        constructor(triggerOptions: any, target: any, public propertyPath: string, public value: any, condition?: Condition) {
            super(triggerOptions, condition);
            this._target = this._effectiveTarget = target;
        }

        public _prepare(): void {
            this._effectiveTarget = this._getEffectiveTarget(this._effectiveTarget, this.propertyPath);
            this._property = this._getProperty(this.propertyPath);
        }

        public execute(): void {
            this._effectiveTarget[this._property] = this.value;
        }
        
        public serialize(parent: any): any {
            return super._serialize({
                name: "SetValueAction",
                properties: [
                    Action._GetTargetProperty(this._target),
                    { name: "propertyPath", value: this.propertyPath },
                    { name: "value", value: Action._SerializeValueAsString(this.value) }
                ]
            }, parent);
        }
    }

    export class IncrementValueAction extends Action {
        private _target: any;
        private _effectiveTarget: any;
        private _property: string;

        constructor(triggerOptions: any, target: any, public propertyPath: string, public value: any, condition?: Condition) {
            super(triggerOptions, condition);
            this._target = this._effectiveTarget = target;
        }

        public _prepare(): void {
            this._effectiveTarget = this._getEffectiveTarget(this._effectiveTarget, this.propertyPath);
            this._property = this._getProperty(this.propertyPath);

            if (typeof this._effectiveTarget[this._property] !== "number") {
                Tools.Warn("Warning: IncrementValueAction can only be used with number values");
            }
        }

        public execute(): void {
            this._effectiveTarget[this._property] += this.value;
        }
        
        public serialize(parent: any): any {
            return super._serialize({
                name: "IncrementValueAction",
                properties: [
                    Action._GetTargetProperty(this._target),
                    { name: "propertyPath", value: this.propertyPath },
                    { name: "value", value: Action._SerializeValueAsString(this.value) }
                ]
            }, parent);
        }
    }

    export class PlayAnimationAction extends Action {
        private _target: any;

        constructor(triggerOptions: any, target: any, public from: number, public to: number, public loop?: boolean, condition?: Condition) {
            super(triggerOptions, condition);
            this._target = target;
        }

        public _prepare(): void {
        }

        public execute(): void {
            var scene = this._actionManager.getScene();
            scene.beginAnimation(this._target, this.from, this.to, this.loop);
        }
        
        public serialize(parent: any): any {
            return super._serialize({
                name: "PlayAnimationAction",
                properties: [
                    Action._GetTargetProperty(this._target),
                    { name: "from", value: String(this.from) },
                    { name: "to", value: String(this.to) },
                    { name: "loop", value: Action._SerializeValueAsString(this.loop) || false }
                ]
            }, parent);
        }
    }

    export class StopAnimationAction extends Action {
        private _target: any;

        constructor(triggerOptions: any, target: any, condition?: Condition) {
            super(triggerOptions, condition);
            this._target = target;
        }

        public _prepare(): void {           
        }

        public execute(): void {
            var scene = this._actionManager.getScene();
            scene.stopAnimation(this._target);
        }
        
        public serialize(parent: any): any {
            return super._serialize({
                name: "StopAnimationAction",
                properties: [Action._GetTargetProperty(this._target)]
            }, parent);
        }
    }

    export class DoNothingAction extends Action {
        constructor(triggerOptions: any = ActionManager.NothingTrigger, condition?: Condition) {
            super(triggerOptions, condition);
        }

        public execute(): void {
        }
        
        public serialize(parent: any): any {
            return super._serialize({
                name: "DoNothingAction",
                properties: []
            }, parent);
        }
    }

    export class CombineAction extends Action {
        constructor(triggerOptions: any, public children: Action[], condition?: Condition) {
            super(triggerOptions, condition);
        }

        public _prepare(): void {
            for (var index = 0; index < this.children.length; index++) {
                this.children[index]._actionManager = this._actionManager;
                this.children[index]._prepare();
            }
        }

        public execute(evt: ActionEvent): void {
            for (var index = 0; index < this.children.length; index++) {
                this.children[index].execute(evt);
            }
        }
        
        public serialize(parent: any): any {
            var serializationObject = super._serialize({
                name: "CombineAction",
                properties: [],
                combine: []
            }, parent);
            
            for (var i=0; i < this.children.length; i++) {
                serializationObject.combine.push(this.children[i].serialize(null));
            }
            
            return serializationObject;
        }
    }

    export class ExecuteCodeAction extends Action {
        constructor(triggerOptions: any, public func: (evt: ActionEvent) => void, condition?: Condition) {
            super(triggerOptions, condition);
        }

        public execute(evt: ActionEvent): void {
            this.func(evt);
        }
    }

    export class SetParentAction extends Action {
        private _parent: any;
        private _target: any;

        constructor(triggerOptions: any, target: any, parent: any, condition?: Condition) {
            super(triggerOptions, condition);
            this._target = target;
            this._parent = parent;
        }

        public _prepare(): void {
        }

        public execute(): void {
            if (this._target.parent === this._parent) {
                return;
            }

            var invertParentWorldMatrix = this._parent.getWorldMatrix().clone();
            invertParentWorldMatrix.invert();

            this._target.position = Vector3.TransformCoordinates(this._target.position, invertParentWorldMatrix);

            this._target.parent = this._parent;
        }
        
        public serialize(parent: any): any {
            return super._serialize({
                name: "SetParentAction",
                properties: [
                    Action._GetTargetProperty(this._target),
                    Action._GetTargetProperty(this._parent),
                ]
            }, parent);
        }
    }

    export class PlaySoundAction extends Action {
        private _sound: Sound;

        constructor(triggerOptions: any, sound: Sound, condition?: Condition) {
            super(triggerOptions, condition);
            this._sound = sound;
        }

        public _prepare(): void {
        }

        public execute(): void {
            if (this._sound !== undefined)
                this._sound.play();
        }
        
        public serialize(parent: any): any {
            return super._serialize({
                name: "PlaySoundAction",
                properties: [{ name: "sound", value: this._sound.name }]
            }, parent);
        }
    }

    export class StopSoundAction extends Action {
        private _sound: Sound;

        constructor(triggerOptions: any, sound: Sound, condition?: Condition) {
            super(triggerOptions, condition);
            this._sound = sound;
        }

        public _prepare(): void {
        }

        public execute(): void {
            if (this._sound !== undefined)
                this._sound.stop();
        }
        
        public serialize(parent: any): any {
            return super._serialize({
                name: "StopSoundAction",
                properties: [{ name: "sound", value: this._sound.name }]
            }, parent);
        }
    }
} 