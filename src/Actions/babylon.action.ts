module BABYLON {
    export class Action {
        public trigger: number;
        public _actionManager: ActionManager;

        private _nextActiveAction: Action;
        private _child: Action;
        private _condition?: Condition;
        private _triggerParameter: any;

        public onBeforeExecuteObservable = new Observable<Action>();

        constructor(public triggerOptions: any, condition?: Condition) {

            if (triggerOptions.parameter) {
                this.trigger = triggerOptions.trigger;
                this._triggerParameter = triggerOptions.parameter;
            } else {
                this.trigger = triggerOptions;
            }

            this._nextActiveAction = this;
            this._condition = condition;
        }

        // Methods
        public _prepare(): void {
        }

        public getTriggerParameter(): any {
            return this._triggerParameter;
        }

        public _executeCurrent(evt?: ActionEvent): void {
            if (this._nextActiveAction._condition) {
                var condition = this._nextActiveAction._condition;
                var currentRenderId = this._actionManager.getScene().getRenderId();

                // We cache the current evaluation for the current frame
                if (condition._evaluationId === currentRenderId) {
                    if (!condition._currentResult) {
                        return;
                    }
                } else {
                    condition._evaluationId = currentRenderId;

                    if (!condition.isValid()) {
                        condition._currentResult = false;
                        return;
                    }

                    condition._currentResult = true;
                }
            }
            
            this.onBeforeExecuteObservable.notifyObservers(this);
            this._nextActiveAction.execute(evt);

            this.skipToNextActiveAction();
        }

        public execute(evt?: ActionEvent): void {

        }

        public skipToNextActiveAction(): void {
            if (this._nextActiveAction._child) {

                if (!this._nextActiveAction._child._actionManager) {
                    this._nextActiveAction._child._actionManager = this._actionManager;
                }

                this._nextActiveAction = this._nextActiveAction._child;
            } else {
                this._nextActiveAction = this;
            }
        }

        public then(action: Action): Action {
            this._child = action;

            action._actionManager = this._actionManager;
            action._prepare();

            return action;
        }

        public _getProperty(propertyPath: string): string {
            return this._actionManager._getProperty(propertyPath);
        }

        public _getEffectiveTarget(target: any, propertyPath: string): any {
            return this._actionManager._getEffectiveTarget(target, propertyPath);
        }
        
        public serialize(parent: any): any {
        }
        
        // Called by BABYLON.Action objects in serialize(...). Internal use
        protected _serialize(serializedAction: any, parent?: any): any {
            var serializationObject: any = { 
                type: 1,
                children: [],
                name: serializedAction.name,
                properties: serializedAction.properties || []
            };
            
            // Serialize child
            if (this._child) { 
                this._child.serialize(serializationObject);
            }
            
            // Check if "this" has a condition
            if (this._condition) {
                var serializedCondition = this._condition.serialize();
                serializedCondition.children.push(serializationObject);
                
                if (parent) {
                    parent.children.push(serializedCondition);
                }
                return serializedCondition;
            }
            
            if (parent) {
                parent.children.push(serializationObject);
            }
            return serializationObject;
        }
        
        public static _SerializeValueAsString = (value: any): string => {
            if (typeof value === "number") {
                return value.toString();
            }
            
            if (typeof value === "boolean") {
                return value ? "true" : "false";
            }
            
            if (value instanceof Vector2) {
                return value.x + ", " + value.y;
            }
            if (value instanceof Vector3) {
                return value.x + ", " + value.y + ", " + value.z;
            }
            
            if (value instanceof Color3) {
                return value.r + ", " + value.g + ", " + value.b;
            }
            if (value instanceof Color4) {
                return value.r + ", " + value.g + ", " + value.b + ", " + value.a;
            }
            
            return value; // string
        };
    
        public static _GetTargetProperty = (target: Scene | Node) => {
            return {
                name: "target",
                targetType: target instanceof Mesh ? "MeshProperties"
                            : target instanceof Light ? "LightProperties"
                            : target instanceof Camera ? "CameraProperties"
                            : "SceneProperties",
                value: target instanceof Scene ? "Scene" : (<Node>target).name
            }  
        };
    }
}
