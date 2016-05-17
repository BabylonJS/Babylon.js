/// <reference path="simpleinteractionhelper.ts" />

module Sandbox {
    import Vector2 = BABYLON.Vector2;
    import Mesh = BABYLON.Mesh;
    import Vector3 = BABYLON.Vector3;
    import Color4 = BABYLON.Color4;
    import StringDictionary = BABYLON.StringDictionary;
    import Group2D = BABYLON.Group2D;
    import Rectangle2D = BABYLON.Rectangle2D;
    import Canvas2D = BABYLON.Canvas2D;
    import Texture = BABYLON.Texture;
    import Sprite2D = BABYLON.Sprite2D;
    import Size = BABYLON.Size;
    import Text2D = BABYLON.Text2D;
    import Matrix = BABYLON.Matrix;
    import Quaternion = BABYLON.Quaternion;
    import StandardMaterial = BABYLON.StandardMaterial;
    import Color3 = BABYLON.Color3;
    import IntersectInfo2D = BABYLON.IntersectInfo2D;
    import PrimitivePointerInfo = BABYLON.PrimitivePointerInfo;

    @className("TestA")
    export class TestA {
        a: number;
    }

    @className("TestB")
    export class TestB extends TestA {
        b: number;
    }

    export function className(name: string): (target: Object) => void {
        return (target: Object) => {
            target["__bjsclassName__"] = name;
        }
    }

    export function getClassName(object): string {
        let name = null;
        if (object instanceof Object) {
            let classObj = Object.getPrototypeOf(object);
            name = classObj.constructor["__bjsclassName__"];
        }
        if (!name) {
            name = typeof object;
        }

        return name;
    }

    export class MainClass {
        engine: BABYLON.Engine;
        scene: BABYLON.Scene;
        camera: BABYLON.TargetCamera;
        start() {
            BABYLON.Engine.CodeRepository = "/src/";
            BABYLON.Engine.ShadersRepository = "/src/Shaders/";

            if (BABYLON.Engine.isSupported() === false) {
                console.log("web browser doesn't support WebGL");
                return;
            }

            var tb = new TestB();

            let res = getClassName(tb);
            res = getClassName(12);

            let pb = Object.getPrototypeOf(tb);
            let pa = Object.getPrototypeOf(pb);

            let nameB = pb.constructor["__className__"];
            let nameA = pa.constructor["__className__"];

            // Get the canvas element from our HTML below
            var htmlCanvasElement = <HTMLCanvasElement>document.querySelector("#renderCanvas");

            //var canvas2d = <HTMLCanvasElement>document.querySelector("#canvas2d");
            //var context = canvas2d.getContext("2d");
            //context.font = "8pt Lucida Console";
            //context.fillStyle = "red";
            //context.textBaseline = 'top';
            //context.fillText("ABCDEFGHIJKLMNOPQRSTUVWXYZ", 0, 0);

            // Load the BABYLON 3D engine
            this.engine = new BABYLON.Engine(htmlCanvasElement, true);

            // Now create a basic Babylon Scene object
            this.scene = new BABYLON.Scene(this.engine);

            //this.scene.debugLayer.show();

            //var instData = new BABYLON.Rectangle2DInstanceData();
            //instData._instancesArray = new Float32Array(100);
            //instData._instanceOffset = 0;

            //instData.zBias = 1;
            //instData.transform = Matrix.Identity();
            //instData.properties = new Vector3(1, 2, 3);


            //var effect = this.engine.createEffect({ vertex: "rect2d", fragment: "rect2d" }, ["zBias", "transform", "properties"], [], [], "");
            //var node = instData.getClassTreeInfo();

            //setTimeout(() => {
            //    var offsets = node.classContent.getOffsetLocations(effect);

            //    },
            //    1000);
            // Change the scene background color to green.
            this.scene.clearColor = new BABYLON.Color3(56 / 256, 87 / 256, 145 / 256);

            // This creates and positions a free camera
            var hpi = Math.PI / 2;
            this.camera = new BABYLON.ArcRotateCamera("camera1", -hpi, hpi, 150, new BABYLON.Vector3(0, 0, 0), this.scene);
            this.camera.setTarget(BABYLON.Vector3.Zero());

            this.camera.attachControl(htmlCanvasElement);

            //this.scene.debugLayer.show();

            let canvas = Canvas2D.CreateScreenSpace(this.scene, "ScreenCanvas", new Vector2(0, 100), new Size(600, 600), Canvas2D.CACHESTRATEGY_DONTCACHE);
            canvas.backgroundFill = Canvas2D.GetSolidColorBrushFromHex("#C0808080");
            canvas.backgroundRoundRadius = 50;

            var g1 = Group2D.CreateGroup2D(canvas, "g1", new Vector2(300, 300), new Size(600, 600));

            g1.pointerEventObservable.add((d, s) => {
                if (s.mask === PrimitivePointerInfo.PointerDown) {
                    canvas.setPointerCapture(d.pointerId, d.relatedTarget);
                }
                else if (s.mask === PrimitivePointerInfo.PointerUp) {
                    canvas.releasePointerCapture(d.pointerId, d.relatedTarget);
                }
                console.log(`Pointer Down on ${d.relatedTarget.id}`);

            }, PrimitivePointerInfo.PointerDown|PrimitivePointerInfo.PointerUp);

            //var text = Text2D.Create(g1, "text", 100, 100, "20pt Lucida Console", "ABCDEFGHIJKLMNOPQRSTUVWXYZ");
            //text.origin = new Vector2(0.0, 1.0);



            var rectList = Array<Rectangle2D>();
            var ss = 600;
            var rs = 100;

            for (var i = 0; i < 50; i++) {
                var posX = Math.random() * ss;
                var posY = Math.random() * ss;

                var w = Math.random() * rs;
                var h = Math.random() * rs;

                var rect = BABYLON.Rectangle2D.Create(g1, "rect" + i.toString(), posX, posY, w, h,
                    BABYLON.Canvas2D.GetSolidColorBrush(new BABYLON.Color4(Math.random(), Math.random(), Math.random(), 1)));
                rect.roundRadius = Math.random() * Math.min(rect.size.width, rect.size.height) * 0.4;
                rect.origin = new Vector2(0.5, 0.5);

                rectList.push(rect);
            }

            let z = canvas.getActualZOffset();
            z = g1.getActualZOffset();
            z = rectList[0].getActualZOffset();
            z = rectList[1].getActualZOffset();

            setInterval(() => {
                //g1.rotation += 0.003;
                //rectList.forEach(r => r.rotation += 0.003);
                //rectList[49].position = new Vector2(rectList[49].position.x + 0.1, rectList[49].position.y+0.6);

//                sprite.rotation += 0.005;
                //rect.rotation += 0.005;

            }, 10);

            //var ii = new IntersectInfo2D();
            //htmlCanvasElement.addEventListener("pointerdown", (event: PointerEvent) => {
            //    var pickPos = new Vector2(event.offsetX, canvas.actualSize.height - event.offsetY);
            //    ii.pickPosition = pickPos;
            //    ii.findFirstOnly = false;
            //    if (canvas.intersect(ii)) {
            //        console.log(`pickPos: ${pickPos.toString()}, intersect: ${ii.intersectedPrimitives[0].prim.id} at: ${ii.intersectedPrimitives[0].intersectionLocation.toString()}`);
            //    }

            //});

            //var texture = new Texture("assets/rock2.png", this.scene, true, true, Texture.NEAREST_SAMPLINGMODE);
            //var sprite = Sprite2D.Create(canvas, "sprite1", 250, 250, texture, new Size(128, 128), new Vector2(0,0));
            //sprite.origin = Vector2.Zero();

            //var canvas = Canvas2D.CreateWorldSpace(this.scene, "ScreenCanvas", new Vector3(0, 0, 0), Quaternion.RotationYawPitchRoll(Math.PI / 4, Math.PI/4, 0), new Size(100, 100), 4, Mesh.DEFAULTSIDE, Canvas2D.CACHESTRATEGY_CANVAS);
            //canvas.backgroundFill = Canvas2D.GetSolidColorBrushFromHex("#C0C0C040");
            //canvas.backgroundRoundRadius = 50;

            //var g1 = Group2D.CreateGroup2D(canvas, "group", Vector2.Zero(), null);
            //g1.scale = 4;

            //var rect = Rectangle2D.Create(g1, "rect", 50, 50, 25, 25, null, Canvas2D.GetGradientColorBrush(new Color4(0.9, 0.3, 0.9, 1), new Color4(1.0, 1.0, 1.0, 1)));
            //rect.borderThickness = 2;
            //rect.roundRadius = 2;

            //var insideRect = Rectangle2D.Create(rect, "insideRect", 0, 0, 10, 10, Canvas2D.GetSolidColorBrushFromHex("#0040F0FF"));
            //insideRect.roundRadius = 1;

            //setInterval(() => {
            //    rect.rotation += 0.01;
            //}, 10);


            //let canvas2 = Canvas2D.CreateScreenSpace(this.scene, "ScreenCanvas", new Vector2(0, 0), new Size(this.engine.getRenderWidth(), this.engine.getRenderHeight()), Canvas2D.CACHESTRATEGY_DONTCACHE);

            //var g1 = Group2D.CreateGroup2D(canvas2, "g1", new Vector2(0, 100));
            ////g1.rotation = Math.PI / 5;

            //var g2 = Group2D.CreateGroup2D(g1, "g2", new Vector2(0, 0), new Size(500, 500));



            //var texture = new Texture("assets/rock2.png", this.scene, true, true, Texture.NEAREST_SAMPLINGMODE);
            //var sprite = Sprite2D.Create(g2, "sprite1", 250, 250, texture, new Size(128, 128), new Vector2(0,0));
            ////sprite.invertY = true;
            //sprite.origin = Vector2.Zero();

            //var r = Rectangle2D.Create(g1, "rect1", 200, 200, 90, 90, Canvas2D.GetSolidColorBrush(new Color4(0.3, 0.3, 0.9, 1)));
            //r.origin = new Vector2(0, 1);
            //r.roundRadius = 0;

            //var r3 = Rectangle2D.Create(g1, "rect3", 200, 50, 200, 90, Canvas2D.GetSolidColorBrush(new Color4(0.3, 0.9, 0.9, 1)));
            //r3.origin = new Vector2(0, 0);
            //r3.roundRadius = 0;

            //let rrList = new Array<Rectangle2D>();
            //for (let i = 0; i < 20; i++) {
            //    let rr = Rectangle2D.Create(g1, `rr${i}`, 20 + i*20, 50, 40, 40, Canvas2D.GetSolidColorBrush(new Color4(0.3 + i/40, i/20, 0.1, 1)));
            //    rr.origin = new Vector2(0, 0);
            //    rr.roundRadius = 0;
            //    rrList.push(rr);
            //}


            ////var r5 = Rectangle2D.Create(g2, "rect3", 10, 10, 50, 50, null, Canvas2D.GetGradientColorBrush(new Color4(0.9, 0.3, 0.9, 1), new Color4(1.0, 1.0, 1.0, 1)));
            ////r5.origin = new Vector2(0, 0);
            ////r5.roundRadius = 1;
            ////var r2 = Rectangle2D.Create(g2, "rect1", 110, 10, 200, 200, Canvas2D.GetSolidColorBrush(new Color4(0.3, 0.3, 0.9, 1)), Canvas2D.GetGradientColorBrush(new Color4(0.9, 0.3, 0.9, 1), new Color4(1.0, 1.0, 1.0, 1)));
            ////r2.borderThickness = 10;
            ////r2.origin = new Vector2(0, 0);
            ////r2.roundRadius = 10;

            //var text = Text2D.Create(g1, "text", 0, 0, "20pt Lucida Console", "ABCDEFGHIJKLMNOPQRSTUVWXYZ");

            //let wc = Canvas2D.CreateWorldSpace(this.scene, "worldSpace", new Vector3(0, 0, 100), Quaternion.Identity(), new Size(100, 100), 4, Mesh.DEFAULTSIDE, Canvas2D.CACHESTRATEGY_CANVAS);

            //var r4 = Rectangle2D.Create(wc, "rect1", -40, 10, 200, 200, Canvas2D.GetSolidColorBrush(new Color4(0.3, 0.3, 0.9, 1)), Canvas2D.GetGradientColorBrush(new Color4(0.9, 0.3, 0.9, 1), new Color4(1.0, 1.0, 1.0, 1)));
            //r4.borderThickness = 10;
            //r4.rotation = 0.2;
            //r4.origin = new Vector2(0, 0);
            //r4.roundRadius = 10;



//            setInterval(() => {
//                rrList.forEach(r => r.rotation += 0.009);

////                g2.position = new Vector2(g2.position.x + 0.1, g2.position.y);
////                sprite.rotation += 0.005;
////                g1.scale += 0.001;
////                r3.position = new Vector2(r3.position.x + 0.0, r3.position.y + 0.1);
//                //text.position = new Vector2(text.position.x + 0.0, text.position.y + 0.1);
//                //r.rotation += 0.005;
//                //r3.rotation -= 0.005;
////                g1.scale += 0.0001;
            //}, 10);

            // This creates a light, aiming 0,1,0 - to the sky.
            //var light = new BABYLON.HemisphericLight("light1", new BABYLON.Vector3(0, 1, 0), this.scene);
            //var light = new BABYLON.DirectionalLight("light1", new BABYLON.Vector3(0, 0, 1), this.scene);
            var light = new BABYLON.PointLight("light1", new BABYLON.Vector3(50, 50, -70), this.scene);
            //light.intensity = 10;
            //light.intensity = 0.5;
            //light.specular = new BABYLON.Color3(0, 0, 0);

            var self = this;

            //var box = Mesh.CreateBox("box", 1, this.scene);
            //box.position = new Vector3(1, 2, 3);
            ////this.scene.constantlyUpdateMeshUnderPointer = true;

            //var box2 = Mesh.CreateBox("box", 2, this.scene);
            //box2.position = new Vector3(-5, 0, 0);
            //box2.parent = box;

            //var mtl = new StandardMaterial("mtl", this.scene);
            //mtl.diffuseColor = new Color3(0, 1, 0);
            //box2.material = mtl;

            //var sih = new SimpleInteractionHelper(this.scene);

            //var points = new Array<Vector3>();
            //points.push(new Vector3(0, 0, 0));
            //points.push(new Vector3(0, 1, 0));
            //points.push(new Vector3(1, 1, 0));
            //points.push(new Vector3(1, 0, 0));
            //points.push(new Vector3(0, 0, 0));

            //var lineMesh = Mesh.CreateLines("lines", points, this.scene);
            //lineMesh.geometry.boundingBias = new Vector2(0, 0.01);

            // Register a render loop to repeatedly render the scene
            this.engine.runRenderLoop(function () {
                htmlCanvasElement.width = window.innerWidth-20;
                htmlCanvasElement.height = window.innerHeight-20;
                if (self.scene) {
                    self.scene.render();
                }
            });
            
            // Watch for browser/canvas resize events
            window.addEventListener("resize", function () {
                if (self.scene) {
                    self.engine.resize();
                }
            });

            this.scene.registerBeforeRender(function () {
                //light.position = camera.position;
                //mousemov = false;
            });

            this.scene.afterRender = function () {
            };

        }
    }
}
