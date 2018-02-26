var createScene = function () {
    var scene = new BABYLON.Scene(engine);

 
    var camera = new BABYLON.ArcRotateCamera("Camera", -Math.PI / 2, 1.0, 110, BABYLON.Vector3.Zero(), scene);
    camera.attachControl(canvas, true);

    var hemi = new BABYLON.HemisphericLight("toto");

    var sphereMaterial = new BABYLON.StandardMaterial();

    //Creation of 6 spheres
    var sphere1 = BABYLON.Mesh.CreateSphere("Sphere1", 10.0, 9.0, scene);
    var sphere2 = BABYLON.Mesh.CreateSphere("Sphere2", 2.0, 9.0, scene);//Only two segments
    var sphere3 = BABYLON.Mesh.CreateSphere("Sphere3", 10.0, 9.0, scene);
    var sphere4 = BABYLON.Mesh.CreateSphere("Sphere4", 10.0, 0.5, scene);
    var sphere5 = BABYLON.Mesh.CreateSphere("Sphere5", 10.0, 9.0, scene);
    var sphere6 = BABYLON.Mesh.CreateSphere("Sphere6", 10.0, 9.0, scene);
    var sphere7 = BABYLON.Mesh.CreateSphere("Sphere7", 10.0, 9.0, scene);

    //Position the spheres
    sphere1.position.x = -30;
    sphere2.position.x = -20;
    sphere3.position.x = -10;
    sphere4.position.x = 0;
    sphere5.position.x = 10;
    sphere6.position.x = 20;
    sphere7.position.x = 30;

    // Material
    sphere1.material = sphereMaterial;
    sphere2.material = sphereMaterial;
    sphere3.material = sphereMaterial;
    sphere4.material = sphereMaterial;
    sphere5.material = sphereMaterial;
    sphere6.material = sphereMaterial;
    sphere7.material = sphereMaterial;

    // GUI
    var advancedTexture = BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI("ui1");

    var panel = new BABYLON.GUI.StackPanel();  
    panel.width = 0.25;
    panel.rotation = 0.2;
    panel.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
    advancedTexture.addControl(panel);

    var button1 = BABYLON.GUI.Button.CreateSimpleButton("but1", "Click Me");
    button1.width = 0.2;
    button1.height = "40px";
    button1.color = "white";
    button1.cornerRadius = 20;
    button1.background = "green";
    button1.onPointerUpObservable.add(function() {
        circle.scaleX += 0.1;
    });
    panel.addControl(button1);

    var circle = new BABYLON.GUI.Ellipse();
    circle.width = "50px";
    circle.color = "white";
    circle.thickness = 5;
    circle.height = "50px";
    circle.paddingTop = "2px";
    circle.paddingBottom = "2px";
    panel.addControl(circle);

    var button2 = BABYLON.GUI.Button.CreateSimpleButton("but2", "Click Me 2");
    button2.width = 0.2;
    button2.height = "40px";
    button2.color = "white";
    button2.background = "green";
    button2.onPointerUpObservable.add(function() {
        circle.scaleX -= 0.1;
    });
    panel.addControl(button2); 

    var createLabel = function(mesh) {
        var label = new BABYLON.GUI.Rectangle("label for " + mesh.name);
        label.background = "black"
        label.height = "30px";
        label.alpha = 0.5;
        label.width = "100px";
        label.cornerRadius = 20;
        label.thickness = 1;
        label.linkOffsetY = 30;
        advancedTexture.addControl(label); 
        label.linkWithMesh(mesh);

        var text1 = new BABYLON.GUI.TextBlock();
        text1.text = mesh.name;
        text1.color = "white";
        label.addControl(text1);  
    }  

    createLabel(sphere1);
    createLabel(sphere2);
    createLabel(sphere3);
    createLabel(sphere4);
    createLabel(sphere5);
    createLabel(sphere6);

    var label = new BABYLON.GUI.Rectangle("label for " + sphere7.name);
    label.background = "black"
    label.height = "30px";
    label.alpha = 0.5;
    label.width = "100px";
    label.cornerRadius = 20;
    label.thickness = 1;
    label.linkOffsetY = 30;
    label.top = "10%";
    label.zIndex = 5;
    label.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP;    
    advancedTexture.addControl(label); 

    var text1 = new BABYLON.GUI.TextBlock();
    text1.text = sphere7.name;
    text1.color = "white";
    label.addControl(text1);    

    var line = new BABYLON.GUI.Line();
    line.alpha = 0.5;
    line.lineWidth = 5;
    line.dash = [5, 10];
    advancedTexture.addControl(line); 
    line.linkWithMesh(sphere7);
    line.connectedControl = label;

    var endRound = new BABYLON.GUI.Ellipse();
    endRound.width = "10px";
    endRound.background = "black";
    endRound.height = "10px";
    endRound.color = "white";
    advancedTexture.addControl(endRound);
    endRound.linkWithMesh(sphere7);

    // Plane
    var plane = BABYLON.Mesh.CreatePlane("plane", 20);
    plane.parent = sphere4;
    plane.position.y = -10;

    // GUI
    var advancedTexture2 = BABYLON.GUI.AdvancedDynamicTexture.CreateForMesh(plane);

    var panel2 = new BABYLON.GUI.StackPanel();  
    panel2.top = "100px";
    advancedTexture2.addControl(panel2);    

    var button1 = BABYLON.GUI.Button.CreateSimpleButton("but1", "Click Me");
    button1.width = 1;
    button1.height = "100px";
    button1.color = "white";
    button1.fontSize = 50;
    button1.background = "green";
    panel2.addControl(button1);

    var textblock = new BABYLON.GUI.TextBlock();
    textblock.height = "150px";
    textblock.fontSize = 100;
    textblock.text = "please pick an option:";
    panel2.addControl(textblock);   

    var addRadio = function(text, parent) {

        var button = new BABYLON.GUI.RadioButton();
        button.width = "40px";
        button.height = "40px";
        button.color = "white";
        button.background = "green";     

        button.onIsCheckedChangedObservable.add(function(state) {
            if (state) {
                textblock.text = "You selected " + text;
            }
        }); 

        var header = BABYLON.GUI.Control.AddHeader(button, text, "400px", { isHorizontal: true, controlFirst: true });
        header.height = "100px";
        header.children[1].fontSize = 80;
        header.children[1].onPointerDownObservable.add(function() {
            button.isChecked = !button.isChecked;
        });

        parent.addControl(header);    
    }


    addRadio("option 1", panel2);
    addRadio("option 2", panel2);
    addRadio("option 3", panel2);
    addRadio("option 4", panel2);
    addRadio("option 5", panel2);    

    scene.registerBeforeRender(function() {
        panel.rotation += 0.01;
    });

    // Another GUI on the right
  var advancedTexture = BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI("UI");
    advancedTexture.layer.layerMask = 2;

    var panel3 = new BABYLON.GUI.StackPanel();
    panel3.width = "220px";
    panel3.fontSize = "14px";
    panel3.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_RIGHT;
    panel3.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_CENTER;
    advancedTexture.addControl(panel3);

    var checkbox = new BABYLON.GUI.Checkbox();
    checkbox.width = "20px";
    checkbox.height = "20px";
    checkbox.isChecked = true;
    checkbox.color = "green";

    var panelForCheckbox = BABYLON.GUI.Control.AddHeader(checkbox, "checkbox", "180px", { isHorizontal: true, controlFirst: true});
    panelForCheckbox.color = "white";
    panelForCheckbox.height = "20px";
    panelForCheckbox.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
    panel3.addControl(panelForCheckbox); 

    var header = new BABYLON.GUI.TextBlock();
    header.text = "Slider:";
    header.height = "40px";
    header.color = "white";
    header.textHorizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
    header.paddingTop = "10px";
    panel3.addControl(header); 

    var slider = new BABYLON.GUI.Slider();
    slider.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
    slider.minimum = 0;
    slider.maximum = 2 * Math.PI;
    slider.color = "green";
    slider.value = 0;
    slider.height = "20px";
    slider.width = "200px";
    panel3.addControl(slider);   

    header = new BABYLON.GUI.TextBlock();
    header.text = "Sphere diffuse:";
    header.height = "40px";
    header.color = "white";
    header.textHorizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
    header.paddingTop = "10px";
    panel3.addControl(header);      

    var picker = new BABYLON.GUI.ColorPicker();
    picker.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
    picker.value = sphereMaterial.diffuseColor;
    picker.height = "150px";
    picker.width = "150px";
    picker.onValueChangedObservable.add(function(value) { // value is a color3
        sphereMaterial.diffuseColor = value;
    });    
    panel3.addControl(picker);  

    return scene;
};
