// jsEditor Manipulation
var PBT = new Object();

PBT.decorationStyles = new Array();
PBT.decorations = new Array();
PBT.ranges = new Array();

PBT.prototype.clearDecorLines = function(lineRanges) {
    this.decorationStyles = [];
    this.decorations = [];
    
    for(var i = 0; i < lineRanges.length; i +=2) {          
        this.decorationStyles.push({ range: new monaco.Range(parseInt(lineRanges[i]),1,parseInt(lineRanges[i + 1]),1), options: { isWholeLine: true, linesDecorationsClassName: 'myLinethis.decorationOff' }});
        this.decorationStyles.push({ range: new monaco.Range(parseInt(lineRanges[i]),1,parseInt(lineRanges[i + 1]),1), options: { isWholeLine: true, className: 'code-back-transparent' }});
        this.decorationStyles.push({ range: new monaco.Range(parseInt(lineRanges[i]),1,parseInt(lineRanges[i + 1]),1), options: { isWholeLine: true, inlineClassName: 'code-transparent' }});
    }

    this.decorations = jsEditor.deltaDecorations.decorations(this.decorations, this.decorationStyles);
}

PBT.prototype.fadeLines = function(lineRanges) {
    this.decorationStyles = [];
    this.decorations = [];
    
    for(var i = 0; i < lineRanges.length; i +=2) {          
        this.decorationStyles.push({ range: new monaco.Range(parseInt(lineRanges[i]),1,parseInt(lineRanges[i + 1]),1), options: { isWholeLine: true, inlineClassName: 'code-transparent' }});
    }

    this.decorations = jsEditor.deltaDecorations.decorations(this.decorations, this.decorationStyles);
}

PBT.prototype.darkenLines = function(lineRanges) {
    this.decorationStyles = [];
    this.decorations = [];
    
    for(var i = 0; i < lineRanges.length; i +=2) {          
        this.decorationStyles.push({ range: new monaco.Range(parseInt(lineRanges[i]),1,parseInt(lineRanges[i + 1]),1), options: { isWholeLine: true, inlineClassName: 'code-highlight' }});
    }

    this.decorations = jsEditor.deltaDecorations.decorations(this.decorations, this.decorationStyles);
}

PBT.prototype.setDecorLines = function (lineRanges) {
    this.decorationStyles = [];
    this.decorations = [];
    
    for(var i = 0; i < lineRanges.length; i +=2) {          
        this.decorationStyles.push({ range: new monaco.Range(parseInt(lineRanges[i]),1,parseInt(lineRanges[i + 1]),1), options: { isWholeLine: true, linesDecorationsClassName: 'myLinethis.decoration' }});
        this.decorationStyles.push({ range: new monaco.Range(parseInt(lineRanges[i]),1,parseInt(lineRanges[i + 1]),1), options: { isWholeLine: true, className: 'code-back-highlight' }});
        this.decorationStyles.push({ range: new monaco.Range(parseInt(lineRanges[i]),1,parseInt(lineRanges[i + 1]),1), options: { isWholeLine: true, inlineClassName: 'code-highlight' }});
    }

    this.decorations = jsEditor.deltaDecorations.decorations(this.decorations, this.decorationStyles);
}

PBT.prototype.replaceLines = function(lineRange, text) {   
    jsEditor.executeEdits("", [
        { range: new monaco.Range(parseInt(lineRange[0]), 1, parseInt(lineRange[1]), 100000), text: text}
   ]);
}

PBT.prototype.hideLines = function(lineRanges) {
    PBT.ranges = [];
    for(var i = 0; i < lineRanges.length; i +=2) {
        PBT.ranges.push(new monaco.Range(parseInt(lineRanges[i]), 1, parseInt(lineRanges[i + 1]), 100000));          
    }
    jsEditor.setHiddenAreas(ranges);
}

PBT.prototype.editOn = function() {
    jsEditor.updateOptions({readOnly: false});
}

PBT.prototype.editOff = function() {
    jsEditor.updateOptions({readOnly: true});
}

//Standard GUI Dialogues
PBT.advancedTexture = BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI("UI");
PBT.protoype.addStandardDialog = function(options) {
    var width = options.width||0.5;
    var height = options.height||0.25;
    var top = options.top||0;
    var left = options.left||0;
    var verticalAlignment = options.verticalAlignment||BABYLON.GUI.Control.VERTICAL_ALIGNMENT_CENTER;
    var horizontalALignment = options.horizontalALignment||BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
    var text = options.text||"Playground Based Tutorial";
    var container = new BABYLON.GUI.Rectangle();
    container.verticalAlignment = verticalAlignment;
    container.horizontalAlignment = horizontalAlignment;
    container.width = width;
    container.height = height;
    container.cornerRadius = 10;
    container.color = "#364249";
    container.thickness = 4;
    container.background = "#CDC98F9";
    container.top = top;
    container.left = left;
    PBT.advancedTexture.addControl(container); 

    var logoPBT = BABYLON.GUI.Button.CreateImageOnlyButton("but", "LogoPBT.png");
    logoPBT.width = 0.4;
    logoPBT.height = 0.8;
    logoPBT.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
    logoPBT.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP;
    logoPBT.top = 2;
    logoPBT.left=2;
    container.addControl(logoPBT);

    var textBlock = new BABYLON.GUI.TextBlock("text", text);
    textBlock.width = 0.55;
    textBlock.height = 0.7
    textBlock.textWrapping = true;
    textBlock.textHorizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
    textBlock.paddingLeft = 2;
    textBlock.color = "white";
    textBlock.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP;
    textBlock.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
    textBlock.left = 0.45;
    textBlock.top = 2;
    container.addControl(textBlock);

    var nextButton = BABYLON.GUI.Button.CreateSimpleButton("nextbut", "Next >");
    nextButton.width = 0.2
    nextButton.height = 0.15;
    nextButton.color = "white";
    nextButton.cornerRadius = 5;
    nextButton.background = "#364249";
    nextButton.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP;
    nextButton.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
    nextButton.left = 0.7;
    nextButton.top = 0.8;
    container.addControl(nextButton);

    var prevButton = BABYLON.GUI.Button.CreateSimpleButton("prevbut", "< Prev");
    prevButton.width = 0.2
    prevButton.height = 0.15;
    prevButton.color = "white";
    prevButton.cornerRadius = 5;
    prevButton.background = "#364249";
    prevButton.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP;
    prevButton.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
    prevButton.left = 0.7;
    prevButton.top = 0.8;
    container.addControl(prevButton);
}


/*
var justStarted = true;

    //radio Controls
        var addRadio = function(text, parent, group, func, checked) {

        checked = checked || false;
        var button = new BABYLON.GUI.RadioButton();
        button.width = "20px";
        button.height = "20px";
        button.color = "white";
        button.background = "green"; 
        button.group = group;
        button.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;

        button.onIsCheckedChangedObservable.add(function(state) {		
            if (state && !justStarted) {
                func();
            }
        }); 

        var header = BABYLON.GUI.Control.AddHeader(button, text, "80px", { isHorizontal: true, controlFirst: true });
        header.height = "30px";

        parent.addControl(header);    
        button.isChecked = checked; 
    }





  



var selectContainer = new BABYLON.GUI.Rectangle();
selectContainer.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_BOTTOM;
selectContainer.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_RIGHT;
selectContainer.width = 0.15;
selectContainer.height = 0.45;
selectContainer.cornerRadius = 10;
selectContainer.color = "Orange";
selectContainer.thickness = 4;
selectContainer.background = "green";
selectContainer.top = -5;
selectContainer.left = -5;
advancedTexture.addControl(selectContainer);

var panel = new BABYLON.GUI.StackPanel(); 
panel.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP;
panel.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
panel.top = 5;
panel.left = 5;
selectContainer.addControl(panel);

var orderHeading = new BABYLON.GUI.TextBlock("orderHead", "Order");
orderHeading.width = 0.9;
orderHeading.height = 0.1
orderHeading.textWrapping = true;
orderHeading.textHorizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
orderHeading.paddingLeft = 2;
panel.addControl(orderHeading); 

addRadio("XYZ", panel, "order", XYZ, true);
addRadio("YXZ", panel, "order", YXZ);
addRadio("YZX", panel, "order", YZX);
addRadio("ZYX", panel, "order", ZYX);
addRadio("ZXY", panel, "order", ZXY);
addRadio("XZY", panel, "order", XZY);

var separator = new BABYLON.GUI.Rectangle();
separator.width = 0.9;
separator.height = 0.02;
separator.background = "orange";
separator.color = "orange";
panel.addControl(separator);

var spaceHeading = new BABYLON.GUI.TextBlock("spaceHead", "Space");
spaceHeading.width = 0.9;
spaceHeading.height = 0.1
spaceHeading.textWrapping = true;
spaceHeading.textHorizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
spaceHeading.paddingLeft = 2;
panel.addControl(spaceHeading);

addRadio("WORLD", panel, "space", worldSpace, true);
addRadio("LOCAL", panel, "space", localSpace);

// check box
    //Selection Controls
    var addCheckBox = function(text, parent, func, checked) {
        
              checked = checked || false;
              var button = new BABYLON.GUI.Checkbox();
              button.width = "20px";
              button.height = "20px";
              button.color = "white";
              button.background = "green"; 
              button.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
        
              button.onIsCheckedChangedObservable.add(function(state) {		
                  func();
              }); 
        
              var header = BABYLON.GUI.Control.AddHeader(button, text, "150px", { isHorizontal: true, controlFirst: true });
              header.height = "30px";
        
              parent.addControl(header);    
              button.isChecked = checked; 
          } 
      
          var hideBoxCode = function() {
              var ranges = [];
              if(boxHideCode) {
                   ranges.push(new monaco.Range(13, 1, 33, 100000)); // box code
                   if(!animHideCode) {
                      ranges.push(new monaco.Range(37, 1, 48, 100000)); // animation code
                   }
              }
              else {
                   if(!animHideCode) {
                      ranges.push(new monaco.Range(37, 1, 48, 100000)); // animation code
                   }
              }
              //ranges.push(new monaco.Range(50, 1, 242, 100000)); // tutor code 2
              //ranges.push(new monaco.Range(246, 1, 250, 100000)); // tutor code 2
              jsEditor.setHiddenAreas(ranges);
              boxHideCode = !boxHideCode;
          }
      
          var hideAnimCode = function() {
              var ranges = [];
              if(animHideCode) {
                  ranges = [];
                  if(!boxHideCode) {
                      ranges.push(new monaco.Range(13, 1, 33, 100000)); // animation code
                   }
                  ranges.push(new monaco.Range(37, 1, 48, 100000)); // animation code
              }
              else {
                  ranges = [];
                  if(!boxHideCode) {
                      ranges.push(new monaco.Range(13, 1, 33, 100000)); // animation code
                   }
              }
              //ranges.push(new monaco.Range(50, 1, 242, 100000)); // tutor code 2
              //ranges.push(new monaco.Range(246, 1, 250, 100000)); // tutor code 2
              jsEditor.setHiddenAreas(ranges);
              animHideCode = !animHideCode;
          } 
      
          var selectContainer = new BABYLON.GUI.Rectangle();
          selectContainer.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_BOTTOM;
          selectContainer.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_RIGHT;
          selectContainer.width = 0.22;
          selectContainer.height = 0.2;
          selectContainer.cornerRadius = 10;
          selectContainer.color = "Orange";
          selectContainer.thickness = 4;
          selectContainer.background = "green";
          selectContainer.top = -5;
          selectContainer.left = -5;
          advancedTexture.addControl(selectContainer);
            
          var panel = new BABYLON.GUI.StackPanel(); 
          panel.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP;
          panel.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
          panel.top = 2;
          panel.left = 4;
          selectContainer.addControl(panel);
      
          var orderHeading = new BABYLON.GUI.TextBlock("orderHead", "Box Mesh");
          orderHeading.width = 0.9;
          orderHeading.height = 0.14
          orderHeading.textWrapping = true;
          orderHeading.textHorizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
          orderHeading.paddingLeft = 2;
          panel.addControl(orderHeading); 
      
          var boxHideCode = true;
          var animHideCode = false;  
          addCheckBox("Hide Box Code", panel, hideBoxCode, true);
      
          var separator = new BABYLON.GUI.Rectangle();
          separator.width = 0.9;
          separator.height = 0.02;
          separator.background = "orange";
          separator.color = "orange";
          panel.addControl(separator);
      
          var gap = new BABYLON.GUI.Rectangle();
          gap.width = 0.9;
          gap.height = 0.1;
          gap.background = "green";
          gap.color = "green";
          panel.addControl(gap);
      
          var spaceHeading = new BABYLON.GUI.TextBlock("spaceHead", "Animation");
          spaceHeading.width = 0.9;
          spaceHeading.height = 0.1
          spaceHeading.textWrapping = true;
          spaceHeading.textHorizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
          spaceHeading.paddingLeft = 2;
          panel.addControl(spaceHeading);
      
          animHideCode = true;  
          addCheckBox("Hide Code", panel, hideAnimCode, true);

          */