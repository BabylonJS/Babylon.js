var createScene = function () {
    var scene = new BABYLON.Scene(engine);

    var camera = new BABYLON.FreeCamera("FreeCamera", new BABYLON.Vector3(0, 0, 0), scene);

    var gunshot = new BABYLON.Sound("Gunshot", "sounds/gunshot.wav", scene, function () {
        console.log("Sound is now ready to be played.");
        // Play immediatly
        gunshot.play();
        // Play after 3 seconds
        gunshot.play(3);
    });

    // Load the sound and play it automatically once ready
    var music = new BABYLON.Sound("Violons", "sounds/violons11.wav", scene, null, { loop: true, autoplay: true });

    window.addEventListener("keydown", function (evt) {
        // Press space key to fire
        if (evt.keyCode === 32) {
            gunshot.play();
        }
    });

    // Stop the music after 5 seconds
    window.setTimeout(function () {
        music.stop();
    }, 10000);

    return scene;
};