var createScene = function () {
    var scene = new BABYLON.Scene(engine);
    // Create camera and light
    var light = new BABYLON.PointLight("Point", new BABYLON.Vector3(5, 10, 5), scene);
    var camera = new BABYLON.FreeCamera("Camera", new BABYLON.Vector3(0, 0, -30), scene);
    
    // Attach the Controls to the canvas
    camera.attachControl(canvas, true);
    
    // Load the JSON file, for simplicity in this demonstration it is included in-line.
    let atlasJSON = getJSONFile();
    
    // Load the SpriteSheet Associated with the JSON Atlas.
    let spriteSheet = new BABYLON.Texture('./textures/spriteMap/none_trimmed/Legends_Level_A.png', scene,
    false, //NoMipMaps
    false, //InvertY usually false if exported from TexturePacker
    BABYLON.Texture.NEAREST_NEAREST, //Sampling Mode
    null, //Onload, you could spin up the sprite map in a function nested here
    null, //OnError
    null, //CustomBuffer
    false, //DeleteBuffer
    BABYLON.Engine.TEXTURETYPE_RGBA //ImageFormageType RGBA
    );
    
    spriteSheet.wrapV = BABYLON.Texture.CLAMP_ADDRESSMODE;
    spriteSheet.wrapU = BABYLON.Texture.CLAMP_ADDRESSMODE; //Or Wrap, its up to you...
    
    let backgroundSize = new BABYLON.Vector2(200,60);
    
    let background = new BABYLON.SpriteMap('background', atlasJSON, spriteSheet,
    {
        stageSize: backgroundSize,
        maxAnimationFrames:8,
        baseTile : 42,
        layerCount: 2,
        flipU: true, //Sometimes you gotta flip the depending on the sprite format.
        colorMultiply : new BABYLON.Vector3(0.3,0.3,0.3)
    },
    scene);    
    
    //Set all the available tiles to the top left corner of the background for Visual debugging, and reference.
    for(var i = 0; i<background.spriteCount; i++){
        background.changeTiles(0, new BABYLON.Vector2(i + 1, backgroundSize.y - 1), i)
    }

    //TILE, FRAME, NEXT TILE, Timing, Speed
    //See documentation for Animation Map Information. - TODO
    let eighth = 1 / 8
    let speed = 0.005
    background.addAnimationToTile(1, 0, 2, eighth * 1, speed)
    background.addAnimationToTile(1, 1, 3, eighth * 2, speed)
    background.addAnimationToTile(1, 2, 4, eighth * 3, speed)
    background.addAnimationToTile(1, 3, 5, eighth * 4, speed)
    background.addAnimationToTile(1, 4, 6, eighth * 5, speed)
    background.addAnimationToTile(1, 5, 7, eighth * 6, speed)
    background.addAnimationToTile(1, 6, 8, eighth * 7, speed)
    background.addAnimationToTile(1, 7, 1, 1, 	  	   speed)

    background.addAnimationToTile(25, 0, 26, eighth * 1, speed)
    background.addAnimationToTile(25, 1, 27, eighth * 2, speed)
    background.addAnimationToTile(25, 2, 28, eighth * 3, speed)
    background.addAnimationToTile(25, 3, 29, eighth * 4, speed)
    background.addAnimationToTile(25, 4, 30, eighth * 5, speed)
    background.addAnimationToTile(25, 5, 31, eighth * 6, speed)
    background.addAnimationToTile(25, 6, 29, eighth * 7, speed)
    background.addAnimationToTile(25, 7, 25, 1, 	 	 speed)

    background.addAnimationToTile(48, 0, 49, 0.25, 	speed)
    background.addAnimationToTile(48, 1, 50, 0.5, 	speed)
    background.addAnimationToTile(48, 2, 51, 0.75, 	speed)
    background.addAnimationToTile(48, 4, 48, 1, 	speed)

    background.addAnimationToTile(49, 0, 50, 0.25, 	speed * 0.5)
    background.addAnimationToTile(49, 1, 51, 0.5, 	speed * 0.5)
    background.addAnimationToTile(49, 2, 48, 0.75, 	speed * 0.5)
    background.addAnimationToTile(49, 4, 49, 1, 	speed * 0.5)

    background.addAnimationToTile(50, 0, 51, 0.25,  speed * 0.3)
    background.addAnimationToTile(50, 1, 48, 0.5,   speed * 0.3)
    background.addAnimationToTile(50, 2, 49, 0.75,  speed * 0.3)
    background.addAnimationToTile(50, 4, 50, 1, 	speed * 0.3)

    background.position.z = 5;

    //Procedurally Editing the Tiles
    //Adding Water to BG
    let tilePositions = []
    for(let x = 15; x < backgroundSize.x - 15; x++){
        for(let y = backgroundSize.y - 26; y > 0; y--){
            if(x % 12 == 0){
                tilePositions.push(new BABYLON.Vector2(x, y))
            }
        }
    }
    background.changeTiles(1, tilePositions, 1)
    
    //Adding Sewer Drains to BG
    tilePositions = []
    for(let x = 15; x < backgroundSize.x - 15; x++){
        if(x % 12 == 0){
            tilePositions.push(new BABYLON.Vector2(x, backgroundSize.y - 26))
        }
    }
    background.changeTiles(1, tilePositions, 25)
    
    //More Water!
    tilePositions = []
    for(let x = 15; x < backgroundSize.x - 15; x++){
        for(let y = backgroundSize.y - 12; y > 0; y--){
            if((x + 6) % 12 == 0){
                tilePositions.push(new BABYLON.Vector2(x, y))
            }
        }
    }
    
    background.changeTiles(1, tilePositions, 1);

    tilePositions = [];
    
    //Random Array for placing variations of the torches animation.
    let pTiles = [48, 49, 50, 48, 49, 50, 48];
    
    //Making the Base of the level
    let levelSize = new BABYLON.Vector2(80,40);
    
    let levelBase = new BABYLON.SpriteMap('base', atlasJSON, spriteSheet,
    {
        stageSize: levelSize,
        maxAnimationFrames:8,
        baseTile : 42,
        layerCount: 2,
        flipU: true,
        colorMultiply : new BABYLON.Vector3(0.6,0.6,0.6)
    },
    scene);
    
    //Duplicating over the animation map from the background system.
    levelBase.animationMap = background.animationMap
    
    
    //Making a hole.
    tilePositions = []
    for(let x = 15; x < levelSize.x - 15; x++){
        for(let y = levelSize.y - 15; y > 15; y--){
            tilePositions.push(new BABYLON.Vector2(x, y))
        }
    }
    levelBase.changeTiles(0, tilePositions, 0)

    //Adding Columns
    tilePositions = []
    for(let x = 15; x < levelSize.x - 15; x++){
        for(let y = levelSize.y - 16; y > 16; y--){
            if(x % 6 == 0){
                tilePositions.push(new BABYLON.Vector2(x, y))
            }
        }
    }
    levelBase.changeTiles(0, tilePositions, 23)

    //Adding Torches
    for(let x = 15; x < levelSize.x - 15; x++){
        if((x + 6) % 12 == 0){
            levelBase.changeTiles(1, new BABYLON.Vector2(x, 18),
            pTiles[Math.floor(Math.random()*pTiles.length)])
        }
    }

    //Adding Caps
    tilePositions = []
    for(let x =1 5; x < levelSize.x - 15; x++){
        if(x % 6 == 0){
         tilePositions.push(new BABYLON.Vector2(x, 16))
        }
    }
    levelBase.changeTiles(0, tilePositions, 24)

    //Adding Bases
    tilePositions = []
    for(let x = 15; x < levelSize.x - 15; x++){
        if(x % 6 == 0){
            tilePositions.push(new BABYLON.Vector2(x, 25))
        }
    }
    levelBase.changeTiles(0, tilePositions, 22)

    //Now this last section was created like all the last two, except it was later exported from the browser and saved.
    //This shows how to load from the .tilemaps file
       
    levelStage = new BABYLON.SpriteMap('levelStage', atlasJSON, spriteSheet,
    {
        stageSize: levelSize,
        maxAnimationFrames:8,
        baseTile : 42,
        layerCount: 2,
        flipU: true
    },
    scene);

    levelStage.loadTileMaps('./textures/spriteMap/none_trimmed/levelStage.tilemaps')
    levelStage.animationMap = background.animationMap
    levelStage.position.z = -5   

    //To download .tilemaps file for this SpriteMap uncomment the below line.
    //levelStage.saveTileMaps();
	
    return scene;
}

const getJSONFile = ()=>{
    return {"frames": [
{
	"filename": "blank.png",
	"frame": {"x":221,"y":221,"w":1,"h":1},
	"rotated": false,
	"trimmed": false,
	"spriteSourceSize": {"x":0,"y":0,"w":32,"h":32},
	"sourceSize": {"w":32,"h":32}
},
{
	"filename": "Falling-Water-0.png",
	"frame": {"x":1,"y":1,"w":32,"h":32},
	"rotated": false,
	"trimmed": false,
	"spriteSourceSize": {"x":0,"y":0,"w":32,"h":32},
	"sourceSize": {"w":32,"h":32}
},
{
	"filename": "Falling-Water-1.png",
	"frame": {"x":1,"y":36,"w":32,"h":32},
	"rotated": false,
	"trimmed": false,
	"spriteSourceSize": {"x":0,"y":0,"w":32,"h":32},
	"sourceSize": {"w":32,"h":32}
},
{
	"filename": "Falling-Water-2.png",
	"frame": {"x":1,"y":71,"w":32,"h":32},
	"rotated": false,
	"trimmed": false,
	"spriteSourceSize": {"x":0,"y":0,"w":32,"h":32},
	"sourceSize": {"w":32,"h":32}
},
{
	"filename": "Falling-Water-3.png",
	"frame": {"x":1,"y":106,"w":32,"h":32},
	"rotated": false,
	"trimmed": false,
	"spriteSourceSize": {"x":0,"y":0,"w":32,"h":32},
	"sourceSize": {"w":32,"h":32}
},
{
	"filename": "Falling-Water-4.png",
	"frame": {"x":1,"y":141,"w":32,"h":32},
	"rotated": false,
	"trimmed": false,
	"spriteSourceSize": {"x":0,"y":0,"w":32,"h":32},
	"sourceSize": {"w":32,"h":32}
},
{
	"filename": "Falling-Water-5.png",
	"frame": {"x":1,"y":176,"w":32,"h":32},
	"rotated": false,
	"trimmed": false,
	"spriteSourceSize": {"x":0,"y":0,"w":32,"h":32},
	"sourceSize": {"w":32,"h":32}
},
{
	"filename": "Falling-Water-6.png",
	"frame": {"x":1,"y":211,"w":32,"h":32},
	"rotated": false,
	"trimmed": false,
	"spriteSourceSize": {"x":0,"y":0,"w":32,"h":32},
	"sourceSize": {"w":32,"h":32}
},
{
	"filename": "Falling-Water-7.png",
	"frame": {"x":1,"y":246,"w":32,"h":32},
	"rotated": false,
	"trimmed": false,
	"spriteSourceSize": {"x":0,"y":0,"w":32,"h":32},
	"sourceSize": {"w":32,"h":32}
},
{
	"filename": "Large-Column-Light-0.png",
	"frame": {"x":36,"y":1,"w":32,"h":32},
	"rotated": false,
	"trimmed": false,
	"spriteSourceSize": {"x":0,"y":0,"w":32,"h":32},
	"sourceSize": {"w":32,"h":32}
},
{
	"filename": "Large-Column-Light-1.png",
	"frame": {"x":71,"y":1,"w":32,"h":32},
	"rotated": false,
	"trimmed": false,
	"spriteSourceSize": {"x":0,"y":0,"w":32,"h":32},
	"sourceSize": {"w":32,"h":32}
},
{
	"filename": "Large-Column-Light-2.png",
	"frame": {"x":106,"y":1,"w":32,"h":32},
	"rotated": false,
	"trimmed": false,
	"spriteSourceSize": {"x":0,"y":0,"w":32,"h":32},
	"sourceSize": {"w":32,"h":32}
},
{
	"filename": "Large-Column-Light-3.png",
	"frame": {"x":141,"y":1,"w":32,"h":32},
	"rotated": false,
	"trimmed": false,
	"spriteSourceSize": {"x":0,"y":0,"w":32,"h":32},
	"sourceSize": {"w":32,"h":32}
},
{
	"filename": "Large_Column-0.png",
	"frame": {"x":176,"y":1,"w":32,"h":32},
	"rotated": false,
	"trimmed": false,
	"spriteSourceSize": {"x":0,"y":0,"w":32,"h":32},
	"sourceSize": {"w":32,"h":32}
},
{
	"filename": "Large_Column-1.png",
	"frame": {"x":211,"y":1,"w":32,"h":32},
	"rotated": false,
	"trimmed": false,
	"spriteSourceSize": {"x":0,"y":0,"w":32,"h":32},
	"sourceSize": {"w":32,"h":32}
},
{
	"filename": "Large_Column-2.png",
	"frame": {"x":246,"y":1,"w":32,"h":32},
	"rotated": false,
	"trimmed": false,
	"spriteSourceSize": {"x":0,"y":0,"w":32,"h":32},
	"sourceSize": {"w":32,"h":32}
},
{
	"filename": "Large_Column-3.png",
	"frame": {"x":36,"y":36,"w":32,"h":32},
	"rotated": false,
	"trimmed": false,
	"spriteSourceSize": {"x":0,"y":0,"w":32,"h":32},
	"sourceSize": {"w":32,"h":32}
},
{
	"filename": "Roman-Column-0.png",
	"frame": {"x":36,"y":71,"w":32,"h":32},
	"rotated": false,
	"trimmed": false,
	"spriteSourceSize": {"x":0,"y":0,"w":32,"h":32},
	"sourceSize": {"w":32,"h":32}
},
{
	"filename": "Roman-Column-1.png",
	"frame": {"x":36,"y":106,"w":32,"h":32},
	"rotated": false,
	"trimmed": false,
	"spriteSourceSize": {"x":0,"y":0,"w":32,"h":32},
	"sourceSize": {"w":32,"h":32}
},
{
	"filename": "Roman-Column-2.png",
	"frame": {"x":36,"y":141,"w":32,"h":32},
	"rotated": false,
	"trimmed": false,
	"spriteSourceSize": {"x":0,"y":0,"w":32,"h":32},
	"sourceSize": {"w":32,"h":32}
},
{
	"filename": "Roman-Column-3.png",
	"frame": {"x":36,"y":176,"w":32,"h":32},
	"rotated": false,
	"trimmed": false,
	"spriteSourceSize": {"x":0,"y":0,"w":32,"h":32},
	"sourceSize": {"w":32,"h":32}
},
{
	"filename": "Roman_Column_Light-0.png",
	"frame": {"x":36,"y":211,"w":32,"h":32},
	"rotated": false,
	"trimmed": false,
	"spriteSourceSize": {"x":0,"y":0,"w":32,"h":32},
	"sourceSize": {"w":32,"h":32}
},
{
	"filename": "Roman_Column_Light-1.png",
	"frame": {"x":36,"y":246,"w":32,"h":32},
	"rotated": false,
	"trimmed": false,
	"spriteSourceSize": {"x":0,"y":0,"w":32,"h":32},
	"sourceSize": {"w":32,"h":32}
},
{
	"filename": "Roman_Column_Light-2.png",
	"frame": {"x":71,"y":36,"w":32,"h":32},
	"rotated": false,
	"trimmed": false,
	"spriteSourceSize": {"x":0,"y":0,"w":32,"h":32},
	"sourceSize": {"w":32,"h":32}
},
{
	"filename": "Roman_Column_Light-3.png",
	"frame": {"x":106,"y":36,"w":32,"h":32},
	"rotated": false,
	"trimmed": false,
	"spriteSourceSize": {"x":0,"y":0,"w":32,"h":32},
	"sourceSize": {"w":32,"h":32}
},
{
	"filename": "Sewer-Drain-0.png",
	"frame": {"x":141,"y":36,"w":32,"h":32},
	"rotated": false,
	"trimmed": false,
	"spriteSourceSize": {"x":0,"y":0,"w":32,"h":32},
	"sourceSize": {"w":32,"h":32}
},
{
	"filename": "Sewer-Drain-1.png",
	"frame": {"x":176,"y":36,"w":32,"h":32},
	"rotated": false,
	"trimmed": false,
	"spriteSourceSize": {"x":0,"y":0,"w":32,"h":32},
	"sourceSize": {"w":32,"h":32}
},
{
	"filename": "Sewer-Drain-2.png",
	"frame": {"x":211,"y":36,"w":32,"h":32},
	"rotated": false,
	"trimmed": false,
	"spriteSourceSize": {"x":0,"y":0,"w":32,"h":32},
	"sourceSize": {"w":32,"h":32}
},
{
	"filename": "Sewer-Drain-3.png",
	"frame": {"x":246,"y":36,"w":32,"h":32},
	"rotated": false,
	"trimmed": false,
	"spriteSourceSize": {"x":0,"y":0,"w":32,"h":32},
	"sourceSize": {"w":32,"h":32}
},
{
	"filename": "Sewer-Drain-4.png",
	"frame": {"x":71,"y":71,"w":32,"h":32},
	"rotated": false,
	"trimmed": false,
	"spriteSourceSize": {"x":0,"y":0,"w":32,"h":32},
	"sourceSize": {"w":32,"h":32}
},
{
	"filename": "Sewer-Drain-5.png",
	"frame": {"x":71,"y":106,"w":32,"h":32},
	"rotated": false,
	"trimmed": false,
	"spriteSourceSize": {"x":0,"y":0,"w":32,"h":32},
	"sourceSize": {"w":32,"h":32}
},
{
	"filename": "Sewer-Drain-6.png",
	"frame": {"x":71,"y":141,"w":32,"h":32},
	"rotated": false,
	"trimmed": false,
	"spriteSourceSize": {"x":0,"y":0,"w":32,"h":32},
	"sourceSize": {"w":32,"h":32}
},
{
	"filename": "Sewer-Drain-7.png",
	"frame": {"x":71,"y":176,"w":32,"h":32},
	"rotated": false,
	"trimmed": false,
	"spriteSourceSize": {"x":0,"y":0,"w":32,"h":32},
	"sourceSize": {"w":32,"h":32}
},
{
	"filename": "Stone-Platform-0.png",
	"frame": {"x":71,"y":211,"w":32,"h":32},
	"rotated": false,
	"trimmed": false,
	"spriteSourceSize": {"x":0,"y":0,"w":32,"h":32},
	"sourceSize": {"w":32,"h":32}
},
{
	"filename": "Stone-Platform-1.png",
	"frame": {"x":71,"y":246,"w":32,"h":32},
	"rotated": false,
	"trimmed": false,
	"spriteSourceSize": {"x":0,"y":0,"w":32,"h":32},
	"sourceSize": {"w":32,"h":32}
},
{
	"filename": "Stone-Platform-2.png",
	"frame": {"x":106,"y":106,"w":32,"h":32},
	"rotated": false,
	"trimmed": false,
	"spriteSourceSize": {"x":0,"y":0,"w":32,"h":32},
	"sourceSize": {"w":32,"h":32}
},
{
	"filename": "Stone-Platform-3.png",
	"frame": {"x":106,"y":141,"w":32,"h":32},
	"rotated": false,
	"trimmed": false,
	"spriteSourceSize": {"x":0,"y":0,"w":32,"h":32},
	"sourceSize": {"w":32,"h":32}
},
{
	"filename": "Stone-Platform-4.png",
	"frame": {"x":106,"y":176,"w":32,"h":32},
	"rotated": false,
	"trimmed": false,
	"spriteSourceSize": {"x":0,"y":0,"w":32,"h":32},
	"sourceSize": {"w":32,"h":32}
},
{
	"filename": "Stone-Platform-5.png",
	"frame": {"x":106,"y":211,"w":32,"h":32},
	"rotated": false,
	"trimmed": false,
	"spriteSourceSize": {"x":0,"y":0,"w":32,"h":32},
	"sourceSize": {"w":32,"h":32}
},
{
	"filename": "Stone-Platform-6.png",
	"frame": {"x":106,"y":246,"w":32,"h":32},
	"rotated": false,
	"trimmed": false,
	"spriteSourceSize": {"x":0,"y":0,"w":32,"h":32},
	"sourceSize": {"w":32,"h":32}
},
{
	"filename": "Stone-Platform-7.png",
	"frame": {"x":141,"y":106,"w":32,"h":32},
	"rotated": false,
	"trimmed": false,
	"spriteSourceSize": {"x":0,"y":0,"w":32,"h":32},
	"sourceSize": {"w":32,"h":32}
},
{
	"filename": "Stone-Platform-8.png",
	"frame": {"x":176,"y":106,"w":32,"h":32},
	"rotated": false,
	"trimmed": false,
	"spriteSourceSize": {"x":0,"y":0,"w":32,"h":32},
	"sourceSize": {"w":32,"h":32}
},
{
	"filename": "Stone-Platform-9.png",
	"frame": {"x":211,"y":106,"w":32,"h":32},
	"rotated": false,
	"trimmed": false,
	"spriteSourceSize": {"x":0,"y":0,"w":32,"h":32},
	"sourceSize": {"w":32,"h":32}
},
{
	"filename": "Stone-Platform-10.png",
	"frame": {"x":106,"y":71,"w":32,"h":32},
	"rotated": false,
	"trimmed": false,
	"spriteSourceSize": {"x":0,"y":0,"w":32,"h":32},
	"sourceSize": {"w":32,"h":32}
},
{
	"filename": "Stone-Platform-11.png",
	"frame": {"x":141,"y":71,"w":32,"h":32},
	"rotated": false,
	"trimmed": false,
	"spriteSourceSize": {"x":0,"y":0,"w":32,"h":32},
	"sourceSize": {"w":32,"h":32}
},
{
	"filename": "Stone-Platform-12.png",
	"frame": {"x":176,"y":71,"w":32,"h":32},
	"rotated": false,
	"trimmed": false,
	"spriteSourceSize": {"x":0,"y":0,"w":32,"h":32},
	"sourceSize": {"w":32,"h":32}
},
{
	"filename": "Stone-Platform-13.png",
	"frame": {"x":211,"y":71,"w":32,"h":32},
	"rotated": false,
	"trimmed": false,
	"spriteSourceSize": {"x":0,"y":0,"w":32,"h":32},
	"sourceSize": {"w":32,"h":32}
},
{
	"filename": "Stone-Platform-14.png",
	"frame": {"x":246,"y":71,"w":32,"h":32},
	"rotated": false,
	"trimmed": false,
	"spriteSourceSize": {"x":0,"y":0,"w":32,"h":32},
	"sourceSize": {"w":32,"h":32}
},
{
	"filename": "Torch-A-0.png",
	"frame": {"x":246,"y":106,"w":32,"h":32},
	"rotated": false,
	"trimmed": false,
	"spriteSourceSize": {"x":0,"y":0,"w":32,"h":32},
	"sourceSize": {"w":32,"h":32}
},
{
	"filename": "Torch-A-1.png",
	"frame": {"x":141,"y":141,"w":32,"h":32},
	"rotated": false,
	"trimmed": false,
	"spriteSourceSize": {"x":0,"y":0,"w":32,"h":32},
	"sourceSize": {"w":32,"h":32}
},
{
	"filename": "Torch-A-2.png",
	"frame": {"x":141,"y":176,"w":32,"h":32},
	"rotated": false,
	"trimmed": false,
	"spriteSourceSize": {"x":0,"y":0,"w":32,"h":32},
	"sourceSize": {"w":32,"h":32}
},
{
	"filename": "Torch-A-3.png",
	"frame": {"x":141,"y":211,"w":32,"h":32},
	"rotated": false,
	"trimmed": false,
	"spriteSourceSize": {"x":0,"y":0,"w":32,"h":32},
	"sourceSize": {"w":32,"h":32}
}],
"meta": {
	"app": "https://www.codeandweb.com/texturepacker",
	"version": "1.0",
	"image": "Legends_Level_A.png",
	"format": "RGBA8888",
	"size": {"w":279,"h":279},
	"scale": "1",
	"smartupdate": "$TexturePacker:SmartUpdate:a755ec93daaec56d1c8bcd801e167677:2e759c84cbaf9134b80c1a34b50e5c9c:9f820b9412efc8199e0407f80b8c0011$"
}
}

}