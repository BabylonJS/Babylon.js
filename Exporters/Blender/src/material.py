from .exporter_settings_panel import *
from .logger import *
from .package_level import *

import bpy
from base64 import b64encode
from mathutils import Color
from os import path, remove
from shutil import copy
from sys import exc_info # for writing errors to log file

# used in Texture constructor, defined in BABYLON.Texture
CLAMP_ADDRESSMODE = 0
WRAP_ADDRESSMODE = 1
MIRROR_ADDRESSMODE = 2

# used in Texture constructor, defined in BABYLON.Texture
EXPLICIT_MODE = 0
SPHERICAL_MODE = 1
#PLANAR_MODE = 2
CUBIC_MODE = 3
#PROJECTION_MODE = 4
#SKYBOX_MODE = 5

DEFAULT_MATERIAL_NAMESPACE = 'Same as Filename'
#===============================================================================
class MultiMaterial:
    def __init__(self, material_slots, idx, nameSpace):
        self.name = nameSpace + '.' + 'Multimaterial#' + str(idx)
        Logger.log('processing begun of multimaterial:  ' + self.name, 2)
        self.material_slots = material_slots
# - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
    def to_scene_file(self, file_handler):
        file_handler.write('{')
        write_string(file_handler, 'name', self.name, True)
        write_string(file_handler, 'id', self.name)

        file_handler.write(',"materials":[')
        first = True
        for material in self.material_slots:
            if first != True:
                file_handler.write(',')
            file_handler.write('"' + material.name +'"')
            first = False
        file_handler.write(']')
        file_handler.write('}')
#===============================================================================
class Texture:
    def __init__(self, slot, level, textureOrImage, mesh, exporter):
        wasBaked = not hasattr(textureOrImage, 'uv_layer')
        if wasBaked:
            image = textureOrImage
            texture = None

            repeat = False
            self.hasAlpha = False
            self.coordinatesIndex = 0
        else:
            texture = textureOrImage
            image = texture.texture.image

            repeat = texture.texture.extension == 'REPEAT'
            self.hasAlpha = texture.texture.use_alpha

            usingMap = texture.uv_layer
            if len(usingMap) == 0:
                usingMap = mesh.data.uv_textures[0].name

            Logger.log('Image texture found, type:  ' + slot + ', mapped using: "' + usingMap + '"', 4)
            if mesh.data.uv_textures[0].name == usingMap:
                self.coordinatesIndex = 0
            elif mesh.data.uv_textures[1].name == usingMap:
                self.coordinatesIndex = 1
            else:
                Logger.warn('Texture is not mapped as UV or UV2, assigned 1', 5)
                self.coordinatesIndex = 0

        # always write the file out, since base64 encoding is easiest from a file
        try:
            imageFilepath = path.normpath(bpy.path.abspath(image.filepath))
            self.fileNoPath = path.basename(imageFilepath)

            internalImage = image.packed_file or wasBaked

            # when coming from either a packed image or a baked image, then save_render
            if internalImage:
                if exporter.scene.textureMethod == INLINE:
                    textureFile = path.join(exporter.textureDir, self.fileNoPath + 'temp')
                else:
                    textureFile = path.join(exporter.textureDir, self.fileNoPath)

                image.save_render(textureFile)

            # when backed by an actual file, copy to target dir, unless inlining
            else:
                textureFile = bpy.path.abspath(image.filepath)
                if not exporter.scene.inlineTextures:
                    copy(textureFile, exporter.textureDir)
        except:
            ex = exc_info()
            Logger.warn('Error encountered processing image file:  ' + ', Error:  '+ str(ex[1]))

        if exporter.scene.textureMethod == INLINE:
            # base64 is easiest from a file, so sometimes a temp file was made above;  need to delete those
            with open(textureFile, "rb") as image_file:
                asString = b64encode(image_file.read()).decode()
            self.encoded_URI = 'data:image/' + image.file_format + ';base64,' + asString

            if internalImage:
                remove(textureFile)

        # build priority Order
        if exporter.scene.textureMethod == PRIORITIZED:
            nameNoExtension = self.fileNoPath.rpartition('.')[0]
            self.priorityNames = []
            for ext in exporter.scene.texturePriority.split():
                self.priorityNames.append(nameNoExtension + ext)

            # add blend image last
            self.priorityNames.append(self.fileNoPath)

        # capture texture attributes
        self.slot = slot
        self.level = level

        if (texture and texture.mapping == 'CUBE'):
            self.coordinatesMode = CUBIC_MODE
        if (texture and texture.mapping == 'SPHERE'):
            self.coordinatesMode = SPHERICAL_MODE
        else:
            self.coordinatesMode = EXPLICIT_MODE

        self.uOffset = texture.offset.x if texture else 0.0
        self.vOffset = texture.offset.y if texture else 0.0
        self.uScale  = texture.scale.x  if texture else 1.0
        self.vScale  = texture.scale.y  if texture else 1.0
        self.uAng = 0
        self.vAng = 0
        self.wAng = 0

        if (repeat):
            if (texture.texture.use_mirror_x):
                self.wrapU = MIRROR_ADDRESSMODE
            else:
                self.wrapU = WRAP_ADDRESSMODE

            if (texture.texture.use_mirror_y):
                self.wrapV = MIRROR_ADDRESSMODE
            else:
                self.wrapV = WRAP_ADDRESSMODE
        else:
            self.wrapU = CLAMP_ADDRESSMODE
            self.wrapV = CLAMP_ADDRESSMODE
# - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
    def to_scene_file(self, file_handler):
        file_handler.write(', \n"' + self.slot + '":{')
        if hasattr(self,'encoded_URI'):
            write_string(file_handler, 'base64String', self.encoded_URI)

        elif hasattr(self,'priorityNames'):
            file_handler.write('"name":[')
            first = True
            for name in self.priorityNames:
                if first == False:
                    file_handler.write(',')
                file_handler.write('"' + name + '"')
                first = False
            file_handler.write(']')

        else:
            write_string(file_handler, 'name', self.fileNoPath, True)

        write_float(file_handler, 'level', self.level)
        write_float(file_handler, 'hasAlpha', self.hasAlpha)
        write_int(file_handler, 'coordinatesMode', self.coordinatesMode)
        write_float(file_handler, 'uOffset', self.uOffset)
        write_float(file_handler, 'vOffset', self.vOffset)
        write_float(file_handler, 'uScale', self.uScale)
        write_float(file_handler, 'vScale', self.vScale)
        write_float(file_handler, 'uAng', self.uAng)
        write_float(file_handler, 'vAng', self.vAng)
        write_float(file_handler, 'wAng', self.wAng)
        write_int(file_handler, 'wrapU', self.wrapU)
        write_int(file_handler, 'wrapV', self.wrapV)
        write_int(file_handler, 'coordinatesIndex', self.coordinatesIndex)
        file_handler.write('}')
#===============================================================================
# need to evaluate the need to bake a mesh before even starting; class also stores specific types of bakes
class BakingRecipe:
    def __init__(self, mesh):
        # transfer from Mesh custom properties
        self.bakeSize    = mesh.data.bakeSize
        self.bakeQuality = mesh.data.bakeQuality # for lossy compression formats
        self.forceBaking = mesh.data.forceBaking # in mesh, but not currently exposed
        self.usePNG      = mesh.data.usePNG      # in mesh, but not currently exposed

        # initialize all members
        self.needsBaking      = self.forceBaking
        self.diffuseBaking    = self.forceBaking
        self.ambientBaking    = False
        self.opacityBaking    = False
        self.reflectionBaking = False
        self.emissiveBaking   = False
        self.bumpBaking       = False
        self.specularBaking   = False

        # need to make sure a single render
        self.cyclesRender     = False
        blenderRender         = False

        # accumulators set by Blender Game
        self.backFaceCulling = True  # used only when baking
        self.isBillboard = len(mesh.material_slots) == 1 and mesh.material_slots[0].material.game_settings.face_orientation == 'BILLBOARD'

        # Cycles specific, need to get the node trees of each material
        self.nodeTrees = []

        for material_slot in mesh.material_slots:
            # a material slot is not a reference to an actual material; need to look up
            material = material_slot.material

            self.backFaceCulling &= material.game_settings.use_backface_culling

            # testing for Cycles renderer has to be different
            if material.use_nodes == True:
                self.needsBaking = True
                self.cyclesRender = True
                self.nodeTrees.append(material.node_tree)

                for node in material.node_tree.nodes:
                    id = node.bl_idname
                    if id == 'ShaderNodeBsdfDiffuse':
                        self.diffuseBaking = True

                    if id == 'ShaderNodeAmbientOcclusion':
                        self.ambientBaking = True

                    # there is no opacity baking for Cycles AFAIK
                    if id == '':
                        self.opacityBaking = True

                    if id == 'ShaderNodeEmission':
                        self.emissiveBaking = True

                    if id == 'ShaderNodeNormal' or id == 'ShaderNodeNormalMap':
                        self.bumpBaking = True

                    if id == '':
                        self.specularBaking = True

            else:
                blenderRender = True
                nDiffuseImages = 0
                nReflectionImages = 0
                nAmbientImages = 0
                nOpacityImages = 0
                nEmissiveImages = 0
                nBumpImages = 0
                nSpecularImages = 0

                textures = [mtex for mtex in material.texture_slots if mtex and mtex.texture]
                for mtex in textures:
                    # ignore empty slots
                    if mtex.texture.type == 'NONE':
                        continue

                    # for images, just need to make sure there is only 1 per type
                    if mtex.texture.type == 'IMAGE' and not self.forceBaking:
                        if mtex.use_map_diffuse or mtex.use_map_color_diffuse:
                            if mtex.texture_coords == 'REFLECTION':
                                nReflectionImages += 1
                            else:
                                nDiffuseImages += 1

                        if mtex.use_map_ambient:
                            nAmbientImages += 1

                        if mtex.use_map_alpha:
                            nOpacityImages += 1

                        if mtex.use_map_emit:
                            nEmissiveImages += 1

                        if mtex.use_map_normal:
                            nBumpImages += 1

                        if mtex.use_map_color_spec:
                            nSpecularImages += 1

                    else:
                        self.needsBaking = True

                        if mtex.use_map_diffuse or mtex.use_map_color_diffuse:
                            if mtex.texture_coords == 'REFLECTION':
                                self.reflectionBaking = True
                            else:
                                self.diffuseBaking = True

                        if mtex.use_map_ambient:
                            self.ambientBaking = True

                        if mtex.use_map_alpha and material.alpha > 0:
                            self.opacityBaking = True

                        if mtex.use_map_emit:
                            self.emissiveBaking = True

                        if mtex.use_map_normal:
                            self.bumpBaking = True

                        if mtex.use_map_color_spec:
                            self.specularBaking = True

                # 2nd pass 2 check for multiples of a given image type
                if nDiffuseImages > 1:
                    self.needsBaking = self.diffuseBaking = True
                if nReflectionImages > 1:
                    self.needsBaking = self.nReflectionImages = True
                if nAmbientImages > 1:
                    self.needsBaking = self.ambientBaking = True
                if nOpacityImages > 1:
                    self.needsBaking = self.opacityBaking = True
                if nEmissiveImages > 1:
                    self.needsBaking = self.emissiveBaking = True
                if nBumpImages > 1:
                    self.needsBaking = self.bumpBaking = True
                if nSpecularImages > 1:
                    self.needsBaking = self.specularBaking = True

        self.multipleRenders = blenderRender and self.cyclesRender

        # check for really old .blend file, eg. 2.49, to ensure that everything requires exists
        if self.needsBaking and bpy.data.screens.find('UV Editing') == -1:
            Logger.warn('Contains material requiring baking, but resources not available.  Probably .blend very old', 2)
            self.needsBaking = False
#===============================================================================
# Not intended to be instanced directly
class Material:
    def __init__(self, checkReadyOnlyOnce, maxSimultaneousLights):
        self.checkReadyOnlyOnce = checkReadyOnlyOnce
        self.maxSimultaneousLights = maxSimultaneousLights
        # first pass of textures, either appending image type or recording types of bakes to do
        self.textures = []
# - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
    def to_scene_file(self, file_handler):
        file_handler.write('{')
        write_string(file_handler, 'name', self.name, True)
        write_string(file_handler, 'id', self.name)
        write_color(file_handler, 'ambient', self.ambient)
        write_color(file_handler, 'diffuse', self.diffuse)
        write_color(file_handler, 'specular', self.specular)
        write_color(file_handler, 'emissive', self.emissive)
        write_float(file_handler, 'specularPower', self.specularPower)
        write_float(file_handler, 'alpha', self.alpha)
        write_bool(file_handler, 'backFaceCulling', self.backFaceCulling)
        write_bool(file_handler, 'checkReadyOnlyOnce', self.checkReadyOnlyOnce)
        write_int(file_handler, 'maxSimultaneousLights', self.maxSimultaneousLights)
        for texSlot in self.textures:
            texSlot.to_scene_file(file_handler)

        file_handler.write('}')
#===============================================================================
class StdMaterial(Material):
    def __init__(self, material_slot, exporter, mesh):
        super().__init__(mesh.data.checkReadyOnlyOnce, mesh.data.maxSimultaneousLights)
        nameSpace = exporter.nameSpace if mesh.data.materialNameSpace == DEFAULT_MATERIAL_NAMESPACE or len(mesh.data.materialNameSpace) == 0 else mesh.data.materialNameSpace
        self.name = nameSpace + '.' + material_slot.name

        Logger.log('processing begun of Standard material:  ' +  material_slot.name, 2)

        # a material slot is not a reference to an actual material; need to look up
        material = material_slot.material

        self.ambient = material.ambient * material.diffuse_color
        self.diffuse = material.diffuse_intensity * material.diffuse_color
        self.specular = material.specular_intensity * material.specular_color
        self.emissive = material.emit * material.diffuse_color
        self.specularPower = material.specular_hardness
        self.alpha = material.alpha

        self.backFaceCulling = material.game_settings.use_backface_culling

        textures = [mtex for mtex in material.texture_slots if mtex and mtex.texture]
        for mtex in textures:
            # test should be un-neccessary, since should be a BakedMaterial; just for completeness
            if (mtex.texture.type != 'IMAGE'):
                continue
            elif not mtex.texture.image:
                Logger.warn('Material has un-assigned image texture:  "' + mtex.name + '" ignored', 3)
                continue
            elif len(mesh.data.uv_textures) == 0:
                Logger.warn('Mesh has no UV maps, material:  "' + mtex.name + '" ignored', 3)
                continue

            if mtex.use_map_diffuse or mtex.use_map_color_diffuse:
                if mtex.texture_coords == 'REFLECTION':
                    Logger.log('Reflection texture found "' + mtex.name + '"', 3)
                    self.textures.append(Texture('reflectionTexture', mtex.diffuse_color_factor, mtex, mesh, exporter))
                else:
                    Logger.log('Diffuse texture found "' + mtex.name + '"', 3)
                    self.textures.append(Texture('diffuseTexture', mtex.diffuse_color_factor, mtex, mesh, exporter))

            if mtex.use_map_ambient:
                Logger.log('Ambient texture found "' + mtex.name + '"', 3)
                self.textures.append(Texture('ambientTexture', mtex.ambient_factor, mtex, mesh, exporter))

            if mtex.use_map_alpha:
                if self.alpha > 0:
                    Logger.log('Opacity texture found "' + mtex.name + '"', 3)
                    self.textures.append(Texture('opacityTexture', mtex.alpha_factor, mtex, mesh, exporter))
                else:
                    Logger.warn('Opacity non-std way to indicate opacity, use material alpha to also use Opacity texture', 4)
                    self.alpha = 1

            if mtex.use_map_emit:
                Logger.log('Emissive texture found "' + mtex.name + '"', 3)
                self.textures.append(Texture('emissiveTexture', mtex.emit_factor, mtex, mesh, exporter))

            if mtex.use_map_normal:
                Logger.log('Bump texture found "' + mtex.name + '"', 3)
                self.textures.append(Texture('bumpTexture', 1.0 / mtex.normal_factor, mtex, mesh, exporter))

            if mtex.use_map_color_spec:
                Logger.log('Specular texture found "' + mtex.name + '"', 3)
                self.textures.append(Texture('specularTexture', mtex.specular_color_factor, mtex, mesh, exporter))
#===============================================================================
class BakedMaterial(Material):
    def __init__(self, exporter, mesh, recipe):
        super().__init__(mesh.data.checkReadyOnlyOnce, mesh.data.maxSimultaneousLights)
        nameSpace = exporter.nameSpace if mesh.data.materialNameSpace == DEFAULT_MATERIAL_NAMESPACE or len(mesh.data.materialNameSpace) == 0 else mesh.data.materialNameSpace
        self.name = nameSpace + '.' + mesh.name
        Logger.log('processing begun of baked material:  ' +  mesh.name, 2)

        # changes to cycles & smart_project occurred in 2.77; need to know what we are running
        bVersion = blenderMajorMinorVersion()

        # any baking already took in the values. Do not want to apply them again, but want shadows to show.
        # These are the default values from StandardMaterials
        self.ambient = Color((0, 0, 0))
        self.diffuse = Color((0.8, 0.8, 0.8)) # needed for shadows, but not change anything else
        self.specular = Color((1, 1, 1))
        self.emissive = Color((0, 0, 0))
        self.specularPower = 64
        self.alpha = 1.0

        self.backFaceCulling = recipe.backFaceCulling

        # texture is baked from selected mesh(es), need to insure this mesh is only one selected
        bpy.ops.object.select_all(action='DESELECT')
        mesh.select = True

        # store setting to restore
        engine = exporter.scene.render.engine

        # mode_set's only work when there is an active object
        exporter.scene.objects.active = mesh

         # UV unwrap operates on mesh in only edit mode, procedurals can also give error of 'no images to be found' when not done
         # select all verticies of mesh, since smart_project works only with selected verticies
        bpy.ops.object.mode_set(mode='EDIT')
        bpy.ops.mesh.select_all(action='SELECT')

        # you need UV on a mesh in order to bake image.  This is not reqd for procedural textures, so may not exist
        # need to look if it might already be created, if so use the first one
        uv = mesh.data.uv_textures[0] if len(mesh.data.uv_textures) > 0 else None

        if uv == None or recipe.forceBaking:
            mesh.data.uv_textures.new('BakingUV')
            uv = mesh.data.uv_textures['BakingUV']
            uv.active = True
            uv.active_render = not recipe.forceBaking # want the other uv's for the source when combining

            if bVersion <= 2.76:
                bpy.ops.uv.smart_project(angle_limit = 66.0, island_margin = 0.0, user_area_weight = 1.0, use_aspect = True)
            else:
                bpy.ops.uv.smart_project(angle_limit = 66.0, island_margin = 0.0, user_area_weight = 1.0, use_aspect = True, stretch_to_bounds = True)

            # syntax for using unwrap enstead of smart project
#            bpy.ops.uv.unwrap(margin = 1.0) # defaulting on all
            uvName = 'BakingUV'  # issues with cycles when not done this way
        else:
            uvName = uv.name

        format = 'PNG' if recipe.usePNG else 'JPEG'

        # create a temporary image & link it to the UV/Image Editor so bake_image works
        image = bpy.data.images.new(name = mesh.name + '_BJS_BAKE', width = recipe.bakeSize, height = recipe.bakeSize, alpha = recipe.usePNG, float_buffer = False)
        image.file_format = format
        image.mapping = 'UV' # default value

        image_settings = exporter.scene.render.image_settings
        image_settings.file_format = format
        image_settings.color_mode = 'RGBA' if recipe.usePNG else 'RGB'
        image_settings.quality = recipe.bakeQuality # for lossy compression formats
        image_settings.compression = recipe.bakeQuality  # Amount of time to determine best compression: 0 = no compression with fast file output, 100 = maximum lossless compression with slow file output

        # now go thru all the textures that need to be baked
        if recipe.diffuseBaking:
            cycles_type = 'DIFFUSE_COLOR' if bVersion <= 2.76 else 'DIFFUSE'
            self.bake('diffuseTexture', cycles_type, 'TEXTURE', image, mesh, uvName, exporter, recipe)

        if recipe.ambientBaking:
            self.bake('ambientTexture', 'AO', 'AO', image, mesh, uvName, exporter, recipe)

        if recipe.opacityBaking:  # no eqivalent found for cycles
            self.bake('opacityTexture', None, 'ALPHA', image, mesh, uvName, exporter, recipe)

        if recipe.reflectionBaking:  # no eqivalent found for cycles
            self.bake('reflectionTexture', None, 'MIRROR_COLOR', image, mesh, uvName, exporter, recipe)

        if recipe.emissiveBaking:
            self.bake('emissiveTexture', 'EMIT', 'EMIT', image, mesh, uvName, exporter, recipe)

        if recipe.bumpBaking:
            self.bake('bumpTexture', 'NORMAL', 'NORMALS', image, mesh, uvName, exporter, recipe)

        if recipe.specularBaking:
            cycles_type = 'SPECULAR' if bVersion <= 2.76 else 'GLOSSY'
            self.bake('specularTexture', cycles_type, 'SPEC_COLOR', image, mesh, uvName, exporter, recipe)

        # Toggle vertex selection & mode, if setting changed their value
        bpy.ops.mesh.select_all(action='TOGGLE')  # still in edit mode toggle select back to previous
        bpy.ops.object.mode_set(toggle=True)      # change back to Object

        bpy.ops.object.select_all(action='TOGGLE') # change scene selection back, not seeming to work

        exporter.scene.render.engine = engine
# - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
    def bake(self, bjs_type, cycles_type, internal_type, image, mesh, uvName, exporter, recipe):
        extension = '.png' if recipe.usePNG else '.jpg'

        if recipe.cyclesRender:
            if cycles_type is None:
                return
            self.bakeCycles(cycles_type, image, uvName, recipe.nodeTrees, extension)
        else:
            self.bakeInternal(internal_type, image, uvName, extension)

        self.textures.append(Texture(bjs_type, 1.0, image, mesh, exporter))
# - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
    def bakeInternal(self, bake_type, image, uvName, extension):
        Logger.log('Internal baking texture, type: ' + bake_type + ', mapped using: ' + uvName, 3)
        # need to use the legal name, since this will become the file name, chars like ':' not legal
        legalName = legal_js_identifier(self.name)
        image.filepath = legalName + '_' + bake_type + extension

        scene = bpy.context.scene
        scene.render.engine = 'BLENDER_RENDER'

        scene.render.bake_type = bake_type

        # assign the image to the UV Editor, which does not have to shown
        bpy.data.screens['UV Editing'].areas[1].spaces[0].image = image

        renderer = scene.render
        renderer.use_bake_selected_to_active = False
        renderer.use_bake_to_vertex_color = False
        renderer.use_bake_clear = False
        renderer.bake_quad_split = 'AUTO'
        renderer.bake_margin = 5
        renderer.use_file_extension = True

        renderer.use_bake_normalize = True
        renderer.use_bake_antialiasing = True

        bpy.ops.object.bake_image()
# - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
    def bakeCycles(self, bake_type, image, uvName, nodeTrees, extension):
        Logger.log('Cycles baking texture, type: ' + bake_type + ', mapped using: ' + uvName, 3)
        legalName = legal_js_identifier(self.name)
        image.filepath = legalName + '_' + bake_type + extension

        scene = bpy.context.scene
        scene.render.engine = 'CYCLES'

        # create an unlinked temporary node to bake to for each material
        for tree in nodeTrees:
            bakeNode = tree.nodes.new(type='ShaderNodeTexImage')
            bakeNode.image = image
            bakeNode.select = True
            tree.nodes.active = bakeNode

        bpy.ops.object.bake(type = bake_type, use_clear = True, margin = 5, use_selected_to_active = False)

        for tree in nodeTrees:
            tree.nodes.remove(tree.nodes.active)
# - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
    @staticmethod
    def meshBakingClean(mesh):
        for uvMap in mesh.data.uv_textures:
            if uvMap.name == 'BakingUV':
                mesh.data.uv_textures.remove(uvMap)
                break

        # remove an image if it was baked
        for image in bpy.data.images:
            if image.name == mesh.name + '_BJS_BAKE':
                image.user_clear() # cannot remove image unless 0 references
                bpy.data.images.remove(image)
                break
