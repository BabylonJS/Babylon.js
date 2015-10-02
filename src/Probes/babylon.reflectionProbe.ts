module BABYLON {
    export class ReflectionProbe{  
        private _scene: Scene;
          
        constructor(size: number, scene: Scene) {
            this._scene = scene;

            this._scene.reflectionProbes.push(this);
        }

        public getScene(): Scene {
            return this._scene;
        }
        
        public dispose() {
            var index = this._scene.reflectionProbes.indexOf(this);

            if (index !== -1) {
                // Remove from the scene if found 
                this._scene.reflectionProbes.splice(index, 1);
            }            
        }
    }    
}