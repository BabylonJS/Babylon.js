module BABYLON {
    export class WebXREnterExitUI implements IDisposable {
        public overlay:HTMLDivElement;
        public buttons:Array<{element:HTMLElement, initializationOptions:XRSessionCreationOptions}> = []
        public static CreateAsync(scene:BABYLON.Scene, helper:WebXRExperienceHelper){
            var ui = new WebXREnterExitUI(scene, helper);
            var supportedPromises = ui.buttons.map((btn)=>{
                return helper.supportsSession(btn.initializationOptions);
            });
            return Promise.all(supportedPromises).then((results)=>{
                results.forEach((supported, i)=>{
                    if(supported){
                        ui.overlay.appendChild(ui.buttons[i].element)
                        ui.buttons[i].element.onclick = async()=>{
                            if(helper.state == BABYLON.WebXRState.IN_XR){
                                await helper.exitXR()
                                return
                            }else if(helper.state == BABYLON.WebXRState.NOT_IN_XR){
                                await helper.enterXR(ui.buttons[i].initializationOptions, "eye-level");
                            }
                        }
                    }
                })
            })
        }
        private constructor(private scene:BABYLON.Scene, private helper:WebXRExperienceHelper){
            this.overlay = document.createElement("div");
            this.overlay.style.cssText = "z-index:11;position: absolute; right: 20px;bottom: 50px;"

            var hmdBtn = document.createElement("button");
            hmdBtn.style.cssText = "color: #868686; border-color: #868686; border-style: solid; margin-left: 10px; height: 50px; width: 80px; background-color: rgba(51,51,51,0.7); background-repeat:no-repeat; background-position: center; outline: none;";
            hmdBtn.innerText = "HMD"
            this.buttons.push({element:hmdBtn, initializationOptions: {immersive: true}})
            
            var windowBtn = document.createElement("button");
            windowBtn.style.cssText = hmdBtn.style.cssText;
            windowBtn.innerText = "Window"
            this.buttons.push({element:windowBtn, initializationOptions: {immersive: false, environmentIntegration: true, outputContext: helper.managedOutputCanvasContext}})
        
            var renderCanvas = scene.getEngine().getRenderingCanvas();
            if(renderCanvas && renderCanvas.parentNode){
                renderCanvas.parentNode.appendChild(this.overlay)
                scene.onDisposeObservable.addOnce(()=>{
                    this.dispose();
                })
            }
        }

        dispose(){
            var renderCanvas = this.scene.getEngine().getRenderingCanvas();
            if(renderCanvas && renderCanvas.parentNode){
                renderCanvas.parentNode.removeChild(this.overlay)
            }
        }
    }
}