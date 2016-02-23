module Sandbox {
    export class MainClass {
        engine: BABYLON.Engine;
        scene: BABYLON.Scene;
        camera: BABYLON.TargetCamera;

        start() {
            BABYLON.Engine.CodeRepository = "/src/";
            BABYLON.Engine.ShadersRepository = "/src/Shaders/";

            if (BABYLON.Engine.isSupported() == false) {
                console.log("web browser doesn't support WebGL");
                return;
            }

            // Get the canvas element from our HTML below
            var canvas = <HTMLCanvasElement>document.querySelector("#renderCanvas");

            // Load the BABYLON 3D engine
            this.engine = new BABYLON.Engine(canvas, true);
            
            // Now create a basic Babylon Scene object
            this.scene = new BABYLON.Scene(this.engine);
            
            // Change the scene background color to green.
            this.scene.clearColor = new BABYLON.Color3(56/256, 87/256, 145/256);

            // This creates and positions a free camera
            this.camera = new BABYLON.FreeCamera("camera1", new BABYLON.Vector3(0, 5, -100), this.scene);
            this.camera.setTarget(BABYLON.Vector3.Zero());

            //this.camera.attachControl(canvas);

            var mesh = BABYLON.Mesh.CreateBox("box01", 70, this.scene);
            mesh.position = new BABYLON.Vector3(0, -30, 0);

            var diffuseTexture = new BABYLON.Texture("assets/rock.png", this.scene);
            var normalsHeightTexture = new BABYLON.Texture("assets/rock_nh.png", this.scene);
            //var diffuseTexture = new BABYLON.Texture("assets/BrickWall.png", this.scene);
            //var normalsHeightTexture = new BABYLON.Texture("assets/BrickWall_nh.png", this.scene);
            var material = new BABYLON.StandardMaterial("mtl01", this.scene);
            material.diffuseTexture = diffuseTexture;
            material.bumpTexture = normalsHeightTexture;
            material.useParallax = true;
            material.specularPower = 500.0;

            mesh.material = material;
            material.specularColor = new BABYLON.Color3(0.5, 0.5, 0.5);

            var combo = <HTMLSelectElement>document.querySelector("#effectList");
            combo.onchange = () => {
                switch (combo.value) {
                    case "none":
                        material.bumpTexture = null;
                        break;
                    case "bump":
                        material.bumpTexture = normalsHeightTexture;
                        material.useParallax = false;
                        break;
                    case "parallax":
                        material.bumpTexture = normalsHeightTexture;
                        material.useParallax = true;
                        material.useParallaxOcclusion = false;
                        break;
                    case "POM":
                        material.bumpTexture = normalsHeightTexture;
                        material.useParallax = true;
                        material.useParallaxOcclusion = true;
                        break;
                }
                material.markDirty();
            };

            var label = <HTMLLabelElement>document.querySelector("#scaleBiasLabel");
            label.innerHTML = "Scale Bias: " + material.parallaxScaleBias;

            document.addEventListener("keydown", (event) => {
                if (event.key == "Up") {
                    material.parallaxScaleBias += 0.01;
                    label.innerHTML = "Scale Bias: " + material.parallaxScaleBias.toFixed(2);
                }
                else if (event.key == "Down") {
                    material.parallaxScaleBias -= 0.01;
                    label.innerHTML = "Scale Bias: " + material.parallaxScaleBias.toFixed(2);
                }
            });

            //this.scene.debugLayer.show();

            // This creates a light, aiming 0,1,0 - to the sky.
            //var light = new BABYLON.HemisphericLight("light1", new BABYLON.Vector3(0, 1, 0), this.scene);
            //var light = new BABYLON.DirectionalLight("light1", new BABYLON.Vector3(0, 0, 1), this.scene);
            var light = new BABYLON.PointLight("light1", new BABYLON.Vector3(50, 50, -70), this.scene);
            //light.intensity = 0.5;
            //light.specular = new BABYLON.Color3(0, 0, 0);

            var self = this;

            //BABYLON.Animation.CreateAndStartAnimation("automotion", mesh, "rotation.x", 60, 480, 0, Math.PI * 2, BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE);
            //BABYLON.Animation.CreateAndStartAnimation("automotion", mesh, "rotation.y", 60, 400, 0, Math.PI * 2, BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE);
            //BABYLON.Animation.CreateAndStartAnimation("automotion", mesh, "rotation.z", 60, 800, 0, Math.PI * 2, BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE);

            // Register a render loop to repeatedly render the scene
            this.engine.runRenderLoop(function () {
                canvas.width = window.innerWidth-50;
                canvas.height = window.innerHeight-50;
                self.scene.render();
            });
            
            // Watch for browser/canvas resize events
            window.addEventListener("resize", function () {
                self.engine.resize();
            });

            // Variables for Mouse interaction
            var mouseDown = false;
            var isRotating = false;
            var shiftState = false;
            var initialMousePosition: BABYLON.Vector2;
            var lastMousePosition: BABYLON.Vector2;
            var thresholdToEnterRotating = 5 * 5;             // Raised to power of 2
            var initialTransformationMatrix: BABYLON.Matrix;

            this.scene.registerBeforeRender(function () {
                //light.position = camera.position;
                //mousemov = false;
            });

            this.scene.afterRender = function () { 
            };

            // Handle User Input
               canvas.addEventListener("pointermove", (event) => {

                if (mouseDown) {
                    // Detect a change in shift key
                    if (shiftState != event.shiftKey) {
                        // Reset the states as we change the rotation mode
                        initialMousePosition = new BABYLON.Vector2(event.clientX, event.clientY);
                        initialTransformationMatrix = mesh.getPivotMatrix();
                        shiftState = event.shiftKey;
                    }

                    var curMousePosition = new BABYLON.Vector2(event.clientX, event.clientY);
                    var deltaPos = curMousePosition.subtract(initialMousePosition);

                    // Check if we have to enter rotating mode
                    if (isRotating == false) {
                        if (deltaPos.lengthSquared() > thresholdToEnterRotating) {
                            isRotating = true;
                        }
                        else {
                            return;
                        }
                    }

                    // We are already or just got in rotation mode
                    var degToRad = Math.PI / 180;
                    var rotationFactor = 1 / 4;	// 4 pixels for 1 degree	
                    var rotatingMatrix = BABYLON.Matrix.RotationYawPitchRoll(
                        event.shiftKey ? 0 : (-deltaPos.x * degToRad * rotationFactor),
                        -deltaPos.y * degToRad * rotationFactor,
                        event.shiftKey ? (deltaPos.x * degToRad * rotationFactor) : 0);

                    var wmtx = self.camera.getWorldMatrix().clone();
                    var invwmtx = wmtx.clone();
                    invwmtx.invert();

                    wmtx.setTranslation(BABYLON.Vector3.Zero());
                    invwmtx.setTranslation(BABYLON.Vector3.Zero());

                    mesh.setPivotMatrix(initialTransformationMatrix.multiply(invwmtx).multiply(rotatingMatrix).multiply(wmtx));
                }

            });

            canvas.addEventListener("pointerdown", function (event) {
                mouseDown = true;
                initialMousePosition = new BABYLON.Vector2(event.clientX, event.clientY);
                initialTransformationMatrix = mesh.getPivotMatrix().clone();
                shiftState = event.shiftKey;
            });

           canvas.addEventListener("pointerup", function (event) {
                mouseDown = false;
            });
        }
    }
}
