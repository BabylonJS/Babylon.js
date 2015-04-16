var gulp = require('gulp-param')(require('gulp'), process.argv),
    uglify = require('gulp-uglify'),
    rename = require('gulp-rename'),
    concat = require('gulp-concat'),
    clean = require('gulp-clean'),
    typescript = require('gulp-typescript'),
	sourcemaps = require('gulp-sourcemaps'),
    shaders = require('./gulp-shaders'),
    gulpFilter = require('gulp-filter');

/**
 * Concat all fx files into one js file.
 */
gulp.task('shaders', function() {
  return gulp.src(['../../Babylon/Shaders/*.fx'])
    .pipe(shaders('shaders.js'))
    .pipe(gulp.dest('build/'))

});

/**
 * Compile typescript files to their js respective files
 */
gulp.task('typescript-to-js', function() {
  //Compile all ts file into their respective js file.
  
  var tsResult = gulp.src(['../../Babylon/**/*.ts','../../References/**/*.d.ts'])
                       .pipe(sourcemaps.init()) // This means sourcemaps will be generated
                       .pipe(typescript({ noExternalResolve: true, target: 'ES5'}));
  
   return tsResult.js
                .pipe(sourcemaps.write('.')) // Now the sourcemaps are added to the .js file
                .pipe(gulp.dest('../../Babylon/'));
});

/**
 * Compile the declaration file babylon.d.ts
 */
gulp.task('typescript-declaration', ['typescript-to-js'], function() {
	
	var tsResult = gulp.src(['../../Babylon/**/*.ts','../../References/**/*.d.ts'])
                       .pipe(typescript({
                           declarationFiles: true,
                           noExternalResolve: true,
						   target: 'ES5'
                       }));

    return tsResult.dts.pipe(concat('babylon.d.ts'))
	.pipe(gulp.dest('build/'));
});

/**
 * Concat all js files in order into one big js file and minify it.
 * The list is based on https://github.com/BabylonJS/Babylon.js/wiki/Creating-the-minified-version
 * Do not hesitate to update it if you need to add your own files.
 */
gulp.task('scripts', ['shaders'] ,function() {
  return gulp.src([
      '../../Babylon/Math/babylon.math.js',
      '../../Babylon/Tools/babylon.database.js',
      '../../Babylon/Tools/babylon.tools.tga.js',
      '../../Babylon/Tools/babylon.tools.dds.js',
      '../../Babylon/Tools/babylon.smartArray.js',
      '../../Babylon/Tools/babylon.smartCollection.js',
      '../../Babylon/Tools/babylon.tools.js',
      '../../Babylon/babylon.engine.js',
      '../../Babylon/babylon.node.js',
      '../../Babylon/Tools/babylon.filesInput.js',
      '../../Babylon/Collisions/babylon.pickingInfo.js',
      '../../Babylon/Culling/babylon.boundingSphere.js',
      '../../Babylon/Culling/babylon.boundingBox.js',
      '../../Babylon/Culling/babylon.boundingInfo.js',
      '../../Babylon/Mesh/babylon.abstractMesh.js',
      '../../Babylon/Lights/babylon.light.js',
      '../../Babylon/Lights/babylon.pointLight.js',
      '../../Babylon/Lights/babylon.spotLight.js',
      '../../Babylon/Lights/babylon.hemisphericLight.js',
      '../../Babylon/Lights/babylon.directionalLight.js',
      '../../Babylon/Lights/Shadows/babylon.shadowGenerator.js',
      '../../Babylon/Collisions/babylon.collider.js',
      '../../Babylon/Cameras/babylon.camera.js',
      '../../Babylon/Cameras/babylon.targetCamera.js',
      '../../Babylon/Cameras/babylon.freeCamera.js',
      '../../Babylon/Cameras/babylon.followCamera.js',
      '../../Babylon/Cameras/babylon.touchCamera.js',
      '../../Babylon/Cameras/babylon.arcRotateCamera.js',
      '../../Babylon/Cameras/babylon.deviceOrientationCamera.js',
      '../../Babylon/Rendering/babylon.renderingManager.js',
      '../../Babylon/Rendering/babylon.renderingGroup.js',
      '../../Babylon/babylon.scene.js',
      '../../Babylon/Mesh/babylon.vertexBuffer.js',
      '../../Babylon/Mesh/babylon.instancedMesh.js',
      '../../Babylon/Mesh/babylon.mesh.js',
      '../../Babylon/Mesh/babylon.subMesh.js',
      '../../Babylon/Materials/Textures/babylon.baseTexture.js',
      '../../Babylon/Materials/Textures/babylon.texture.js',
      '../../Babylon/Materials/Textures/babylon.cubeTexture.js',
      '../../Babylon/Materials/Textures/babylon.renderTargetTexture.js',
      '../../Babylon/Materials/Textures/Procedurals/babylon.proceduralTexture.js',
      '../../Babylon/Materials/Textures/babylon.mirrorTexture.js',
      '../../Babylon/Materials/Textures/babylon.dynamicTexture.js',
      '../../Babylon/Materials/Textures/babylon.videoTexture.js',
      '../../Babylon/Materials/Textures/Procedurals/babylon.customProceduralTexture.js',
      '../../Babylon/Materials/Textures/babylon.proceduralTexture.js',
      '../../Babylon/Materials/Textures/Procedurals/babylon.standardProceduralTexture.js',
      '../../Babylon/Materials/babylon.effect.js',
      'build/shaders.js',
      '../../Babylon/Materials/babylon.material.js',
      '../../Babylon/Materials/babylon.standardMaterial.js',
      '../../Babylon/Materials/babylon.multiMaterial.js',
      '../../Babylon/Loading/babylon.sceneLoader.js',
      '../../Babylon/Loading/Plugins/babylon.babylonFileLoader.js',
      '../../Babylon/Sprites/babylon.spriteManager.js',
      '../../Babylon/Sprites/babylon.sprite.js',
      '../../Babylon/Layer/babylon.layer.js',
      '../../Babylon/Particles/babylon.particle.js',
      '../../Babylon/Particles/babylon.particleSystem.js',
      '../../Babylon/Animations/babylon.animation.js',
      '../../Babylon/Animations/babylon.animatable.js',
      '../../Babylon/Animations/babylon.easing.js',
      '../../Babylon/Culling/Octrees/babylon.octree.js',
      '../../Babylon/Culling/Octrees/babylon.octreeBlock.js',
      '../../Babylon/Bones/babylon.bone.js',
      '../../Babylon/Bones/babylon.skeleton.js',
      '../../Babylon/Bones/babylon.skeleton.js',
      '../../Babylon/PostProcess/babylon.postProcess.js',
      '../../Babylon/PostProcess/babylon.postProcessManager.js',
      '../../Babylon/PostProcess/babylon.passPostProcess.js',
      '../../Babylon/PostProcess/babylon.blurPostProcess.js',
      '../../Babylon/PostProcess/babylon.refractionPostProcess.js',
      '../../Babylon/PostProcess/babylon.blackAndWhitePostProcess.js',
      '../../Babylon/PostProcess/babylon.convolutionPostProcess.js',
      '../../Babylon/PostProcess/babylon.filterPostProcess.js',
      '../../Babylon/PostProcess/babylon.fxaaPostProcess.js',
      '../../Babylon/LensFlare/babylon.lensFlare.js',
      '../../Babylon/LensFlare/babylon.lensFlareSystem.js',
      '../../Babylon/Physics/Plugins/babylon.cannonJSPlugin.js',
      '../../Babylon/Physics/Plugins/babylon.oimoJSPlugin.js',
      '../../Babylon/Physics/babylon.physicsEngine.js',
      '../../Babylon/Tools/babylon.sceneSerializer.js',
      '../../Babylon/Mesh/babylon.csg.js',
      '../../Babylon/PostProcess/babylon.oculusDistortionCorrectionPostProcess.js',
      '../../Babylon/Tools/babylon.virtualJoystick.js',
      '../../Babylon/Cameras/VR/babylon.oculusCamera.js',
      '../../Babylon/Cameras/VR/babylon.oculusGamepadCamera.js',
      '../../Babylon/Cameras/babylon.virtualJoysticksCamera.js',
      '../../Babylon/Materials/babylon.shaderMaterial.js',
      '../../Babylon/Mesh/babylon.mesh.vertexData.js',
      '../../Babylon/Cameras/babylon.anaglyphCamera.js',
      '../../Babylon/PostProcess/babylon.anaglyphPostProcess.js',
      '../../Babylon/Tools/babylon.tags.js',
      '../../Babylon/Tools/babylon.andOrNotEvaluator.js',
      '../../Babylon/PostProcess/RenderPipeline/babylon.postProcessRenderPass.js',
      '../../Babylon/PostProcess/RenderPipeline/babylon.postProcessRenderEffect.js',
      '../../Babylon/PostProcess/RenderPipeline/babylon.postProcessRenderPipeline.js',
      '../../Babylon/PostProcess/RenderPipeline/babylon.postProcessRenderPipelineManager.js',
      '../../Babylon/PostProcess/babylon.displayPassPostProcess.js',
      '../../Babylon/Rendering/babylon.boundingBoxRenderer.js',
      '../../Babylon/Actions/babylon.condition.js',
      '../../Babylon/Actions/babylon.action.js',
      '../../Babylon/Actions/babylon.actionManager.js',
      '../../Babylon/Actions/babylon.interpolateValueAction.js',
      '../../Babylon/Actions/babylon.directActions.js',
      '../../Babylon/Mesh/babylon.geometry.js',
      '../../Babylon/Mesh/babylon.groundMesh.js',
      '../../Babylon/Mesh/babylon.instancedMesh.js',
      '../../Babylon/Tools/babylon.gamepads.js',
      '../../Babylon/Cameras/babylon.gamepadCamera.js',
      '../../Babylon/Mesh/babylon.linesMesh.js',
      '../../Babylon/Rendering/babylon.outlineRenderer.js',
      '../../Babylon/Tools/babylon.assetsManager.js',
      '../../Babylon/Cameras/VR/babylon.vrDeviceOrientationCamera.js',
      '../../Babylon/Cameras/VR/babylon.webVRCamera.js',
      '../../Babylon/Tools/babylon.sceneOptimizer.js',
      '../../Babylon/Mesh/babylon.meshLODLevel.js',
      '../../Babylon/Audio/babylon.audioEngine.js',
      '../../Babylon/Audio/babylon.sound.js',
      '../../Babylon/Audio/babylon.soundtrack.js',
      '../../Babylon/Debug/babylon.debugLayer.js',
      '../../Babylon/Materials/Textures/babylon.rawTexture.js',
      '../../Babylon/Mesh/babylon.polygonMesh.js',
      '../../Babylon/Mesh/babylon.meshSimplification.js',
      '../../Babylon/Audio/babylon.analyser.js',
      '../../Babylon/Rendering/babylon.depthRenderer.js',
      '../../Babylon/PostProcess/babylon.ssaoRenderingPipeline.js',
      '../../Babylon/PostProcess/babylon.volumetricLightScatteringPostProcess.js',
      '../../Babylon/PostProcess/babylon.lensRenderingPipeline.js',
	  '../../Babylon/PostProcess/babylon.colorCorrectionPostProcess.js'
    ])
    .pipe(concat('babylon.js'))
    .pipe(gulp.dest('build/'))
    .pipe(rename({suffix: '.min'}))
    //.pipe(uglify({ outSourceMap: true })) //waiting for https://github.com/gulpjs/gulp/issues/356
    .pipe(uglify())
    .pipe(gulp.dest('build/'))

});

/**
 * Clean temporary files
 * Called after the task scripts
 */
gulp.task('clean', ['scripts'], function() {
  return gulp.src(['build/shaders.js'], {read: false})
    .pipe(clean());
});

/**
 * The default task, call the tasks: shaders, scripts, clean
 */
gulp.task('default', function() {
    gulp.start('shaders','scripts', 'clean');
});

/**
 * The default typescript task, call the tasks: shaders, scripts, clean AFTER the task typescript-to-js
 */
gulp.task('typescript', ['typescript-declaration'], function() {
    gulp.start('shaders','scripts', 'clean');
});

/**
 * Watch task, will call the default task if a js file is updated.
 */
gulp.task('watch', function() {
  gulp.watch('src/**/*.js', ['default']);
});

/**
 * Watch typescript task, will call the default typescript task if a typescript file is updated.
 */
gulp.task('watch-typescript', function() {
  gulp.watch('src/**/*.ts', ['typescript']);
});

/**
 * task to uglify a file passed as an argument
 */
gulp.task('makeUgly' ,function(path, fileIn) {
  if (path.lastIndexOf('/') + 1 !== path.length) { path  += '/'; }

  return gulp.src([path + fileIn])
    .pipe(rename({suffix: '.min'}))
    .pipe(uglify())
    .pipe(gulp.dest(path))

});
