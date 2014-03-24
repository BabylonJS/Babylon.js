var gulp = require('gulp'),
    uglify = require('gulp-uglify'),
    rename = require('gulp-rename'),
    concat = require('gulp-concat'),
    clean = require('gulp-clean'),
    shaders = require('./gulp-shaders');

gulp.task('shaders', function() {
  return gulp.src(['../../Babylon/Shaders/*.fx'])
    .pipe(shaders('shaders.js'))
    .pipe(gulp.dest('build/'))

});

gulp.task('scripts', ['shaders'] ,function() {
  return gulp.src([
      '../../Babylon/Math/babylon.math.js',
      '../../Babylon/Math/babylon.axis.js',
      '../../Babylon/Tools/babylon.database.js',
      '../../Babylon/Tools/babylon.tools.js',
      '../../Babylon/Collisions/babylon.pickingInfo.js',
      '../../Babylon/babylon.engine.js',
      '../../Babylon/babylon.node.js',
      '../../Babylon/Culling/babylon.boundingSphere.js',
      '../../Babylon/Culling/babylon.boundingBox.js',
      '../../Babylon/Culling/babylon.boundingInfo.js',
      '../../Babylon/Lights/babylon.light.js',
      '../../Babylon/Lights/babylon.pointLight.js',
      '../../Babylon/Lights/babylon.spotLight.js',
      '../../Babylon/Lights/babylon.hemisphericLight.js',
      '../../Babylon/Lights/babylon.directionalLight.js',
      '../../Babylon/Lights/Shadows/babylon.shadowGenerator.js',
      '../../Babylon/Collisions/babylon.collider.js',
      '../../Babylon/Cameras/babylon.camera.js',
      '../../Babylon/Cameras/babylon.freeCamera.js',
      '../../Babylon/Cameras/babylon.touchCamera.js',
      '../../Babylon/Cameras/babylon.arcRotateCamera.js',
      '../../Babylon/Cameras/babylon.deviceOrientationCamera.js',
      '../../Babylon/Rendering/babylon.renderingManager.js',
      '../../Babylon/Rendering/babylon.renderingGroup.js',
      '../../Babylon/babylon.scene.js',
      '../../Babylon/Mesh/babylon.vertexBuffer.js',
      '../../Babylon/Mesh/babylon.mesh.js',
      '../../Babylon/Mesh/babylon.subMesh.js',
      '../../Babylon/Materials/textures/babylon.baseTexture.js',
      '../../Babylon/Materials/textures/babylon.texture.js',
      '../../Babylon/Materials/textures/babylon.cubeTexture.js',
      '../../Babylon/Materials/textures/babylon.renderTargetTexture.js',
      '../../Babylon/Materials/textures/babylon.mirrorTexture.js',
      '../../Babylon/Materials/textures/babylon.dynamicTexture.js',
      '../../Babylon/Materials/textures/babylon.videoTexture.js',
      '../../Babylon/Materials/babylon.effect.js',
      'build/shaders.js',
      '../../Babylon/Materials/babylon.material.js',
      '../../Babylon/Materials/babylon.standardMaterial.js',
      '../../Babylon/Materials/babylon.multiMaterial.js',
      '../../Babylon/Tools/babylon.sceneLoader.js',
      '../../Babylon/Tools/babylon.database.js',
      '../../Babylon/Sprites/babylon.spriteManager.js',
      '../../Babylon/Sprites/babylon.sprite.js',
      '../../Babylon/Layer/babylon.layer.js',
      '../../Babylon/Particles/babylon.particle.js',
      '../../Babylon/Particles/babylon.particleSystem.js',
      '../../Babylon/Animations/babylon.animation.js',
      '../../Babylon/Animations/babylon.animatable.js',
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
      '../../Babylon/PostProcess/babylon.fxaaPostProcess.js',
      '../../Babylon/LensFlare/babylon.lensFlare.js',
      '../../Babylon/LensFlare/babylon.lensFlareSystem.js',
      '../../Babylon/Tools/babylon.filesInput.js',
      '../../Babylon/Physics/babylon.physicsEngine.js',
      '../../Babylon/Physics/babylon.sceneSerializer.js',
    ])
    .pipe(concat('babylon.js'))
    .pipe(gulp.dest('build/'))
    .pipe(rename({suffix: '.min'}))
    //.pipe(uglify({ outSourceMap: true })) //waiting for https://github.com/gulpjs/gulp/issues/356
    .pipe(uglify())
    .pipe(gulp.dest('build/'))

});

gulp.task('clean', ['scripts'], function() {
  return gulp.src(['build/shaders.js'], {read: false})
    .pipe(clean());
});

gulp.task('default', function() {
    gulp.start('shaders','scripts', 'clean');
});

gulp.task('watch', function() {
  gulp.watch('src/**/*.js', ['default']);
});
