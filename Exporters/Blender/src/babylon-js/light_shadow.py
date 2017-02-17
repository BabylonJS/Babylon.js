from .logger import *
from .package_level import *

from .f_curve_animatable import *

import bpy
from mathutils import Color, Vector

# used in Light constructor, never formally defined in Babylon, but used in babylonFileLoader
POINT_LIGHT = 0
DIRECTIONAL_LIGHT = 1
SPOT_LIGHT = 2
HEMI_LIGHT = 3

#used in ShadowGenerators
NO_SHADOWS = 'NONE'
STD_SHADOWS = 'STD'
POISSON_SHADOWS = 'POISSON'
VARIANCE_SHADOWS = 'VARIANCE'
BLUR_VARIANCE_SHADOWS = 'BLUR_VARIANCE'
#===============================================================================
class Light(FCurveAnimatable):
    def __init__(self, light, meshesAndNodes):
        if light.parent and light.parent.type != 'ARMATURE':
            self.parentId = light.parent.name

        self.name = light.name
        Logger.log('processing begun of light (' + light.data.type + '):  ' + self.name)
        self.define_animations(light, False, True, False)

        light_type_items = {'POINT': POINT_LIGHT, 'SUN': DIRECTIONAL_LIGHT, 'SPOT': SPOT_LIGHT, 'HEMI': HEMI_LIGHT, 'AREA': POINT_LIGHT}
        self.light_type = light_type_items[light.data.type]

        if self.light_type == POINT_LIGHT:
            self.position = light.location
            if hasattr(light.data, 'use_sphere'):
                if light.data.use_sphere:
                    self.range = light.data.distance

        elif self.light_type == DIRECTIONAL_LIGHT:
            self.position = light.location
            self.direction = Light.get_direction(light.matrix_local)

        elif self.light_type == SPOT_LIGHT:
            self.position = light.location
            self.direction = Light.get_direction(light.matrix_local)
            self.angle = light.data.spot_size
            self.exponent = light.data.spot_blend * 2
            if light.data.use_sphere:
                self.range = light.data.distance

        else:
            # Hemi
            matrix_local = light.matrix_local.copy()
            matrix_local.translation = Vector((0, 0, 0))
            self.direction = (Vector((0, 0, -1)) * matrix_local)
            self.direction = scale_vector(self.direction, -1)
            self.groundColor = Color((0, 0, 0))

        self.intensity = light.data.energy
        self.diffuse   = light.data.color if light.data.use_diffuse  else Color((0, 0, 0))
        self.specular  = light.data.color if light.data.use_specular else Color((0, 0, 0))

        # inclusion section
        if light.data.use_own_layer:
            lampLayer = getLayer(light)
            self.includedOnlyMeshesIds = []
            for mesh in meshesAndNodes:
                if mesh.layer == lampLayer:
                    self.includedOnlyMeshesIds.append(mesh.name)
# - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
    @staticmethod
    def get_direction(matrix):
        return (matrix.to_3x3() * Vector((0.0, 0.0, -1.0))).normalized()
# - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
    def to_scene_file(self, file_handler):
        file_handler.write('{')
        write_string(file_handler, 'name', self.name, True)
        write_string(file_handler, 'id', self.name)
        write_float(file_handler, 'type', self.light_type)

        if hasattr(self, 'parentId'   ): write_string(file_handler, 'parentId'   , self.parentId   )
        if hasattr(self, 'position'   ): write_vector(file_handler, 'position'   , self.position   )
        if hasattr(self, 'direction'  ): write_vector(file_handler, 'direction'  , self.direction  )
        if hasattr(self, 'angle'      ): write_float (file_handler, 'angle'      , self.angle      )
        if hasattr(self, 'exponent'   ): write_float (file_handler, 'exponent'   , self.exponent   )
        if hasattr(self, 'groundColor'): write_color (file_handler, 'groundColor', self.groundColor)
        if hasattr(self, 'range'      ): write_float (file_handler, 'range'      , self.range      )

        write_float(file_handler, 'intensity', self.intensity)
        write_color(file_handler, 'diffuse', self.diffuse)
        write_color(file_handler, 'specular', self.specular)

        if hasattr(self, 'includedOnlyMeshesIds'):
            file_handler.write(',"includedOnlyMeshesIds":[')
            first = True
            for meshId in self.includedOnlyMeshesIds:
                if first != True:
                    file_handler.write(',')
                first = False

                file_handler.write('"' + meshId + '"')

            file_handler.write(']')


        super().to_scene_file(file_handler) # Animations
        file_handler.write('}')
#===============================================================================
class ShadowGenerator:
    def __init__(self, lamp, meshesAndNodes, scene):
        Logger.log('processing begun of shadows for light:  ' + lamp.name)
        self.lightId = lamp.name
        self.mapSize = lamp.data.shadowMapSize
        self.shadowBias = lamp.data.shadowBias

        if lamp.data.shadowMap == VARIANCE_SHADOWS:
            self.useVarianceShadowMap = True
        elif lamp.data.shadowMap == POISSON_SHADOWS:
            self.usePoissonSampling = True
        elif lamp.data.shadowMap == BLUR_VARIANCE_SHADOWS:
            self.useBlurVarianceShadowMap = True
            self.shadowBlurScale = lamp.data.shadowBlurScale
            self.shadowBlurBoxOffset = lamp.data.shadowBlurBoxOffset

        # .babylon specific section
        self.shadowCasters = []
        for mesh in meshesAndNodes:
            if (mesh.castShadows):
                self.shadowCasters.append(mesh.name)
# - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
    def to_scene_file(self, file_handler):
        file_handler.write('{')
        write_int(file_handler, 'mapSize', self.mapSize, True)
        write_string(file_handler, 'lightId', self.lightId)
        write_float(file_handler, 'bias', self.shadowBias)

        if hasattr(self, 'useVarianceShadowMap') :
            write_bool(file_handler, 'useVarianceShadowMap', self.useVarianceShadowMap)
        elif hasattr(self, 'usePoissonSampling'):
            write_bool(file_handler, 'usePoissonSampling', self.usePoissonSampling)
        elif hasattr(self, 'useBlurVarianceShadowMap'):
            write_bool(file_handler, 'useBlurVarianceShadowMap', self.useBlurVarianceShadowMap)
            write_int(file_handler, 'blurScale', self.shadowBlurScale)
            write_int(file_handler, 'blurBoxOffset', self.shadowBlurBoxOffset)

        file_handler.write(',"renderList":[')
        first = True
        for caster in self.shadowCasters:
            if first != True:
                file_handler.write(',')
            first = False

            file_handler.write('"' + caster + '"')

        file_handler.write(']')
        file_handler.write('}')
#===============================================================================
bpy.types.Lamp.autoAnimate = bpy.props.BoolProperty(
    name='Auto launch animations',
    description='',
    default = False
)
bpy.types.Lamp.shadowMap = bpy.props.EnumProperty(
    name='Shadow Map',
    description='',
    items = ((NO_SHADOWS           , 'None'         , 'No Shadow Maps'),
             (STD_SHADOWS          , 'Standard'     , 'Use Standard Shadow Maps'),
             (POISSON_SHADOWS      , 'Poisson'      , 'Use Poisson Sampling'),
             (VARIANCE_SHADOWS     , 'Variance'     , 'Use Variance Shadow Maps'),
             (BLUR_VARIANCE_SHADOWS, 'Blur Variance', 'Use Blur Variance Shadow Maps')
            ),
    default = NO_SHADOWS
)

bpy.types.Lamp.shadowMapSize = bpy.props.IntProperty(
    name='Shadow Map Size',
    description='',
    default = 512
)
bpy.types.Lamp.shadowBias = bpy.props.FloatProperty(
    name='Shadow Bias',
    description='',
    default = 0.00005
)

bpy.types.Lamp.shadowBlurScale = bpy.props.IntProperty(
    name='Blur Scale',
    description='',
    default = 2
)

bpy.types.Lamp.shadowBlurBoxOffset = bpy.props.IntProperty(
    name='Blur Box Offset',
    description='',
    default = 0
)
#===============================================================================
class LightPanel(bpy.types.Panel):
    bl_label = get_title()
    bl_space_type = 'PROPERTIES'
    bl_region_type = 'WINDOW'
    bl_context = 'data'

    @classmethod
    def poll(cls, context):
        ob = context.object
        return ob is not None and isinstance(ob.data, bpy.types.Lamp)

    def draw(self, context):
        ob = context.object
        layout = self.layout
        layout.prop(ob.data, 'shadowMap')
        layout.prop(ob.data, 'shadowMapSize')
        layout.prop(ob.data, 'shadowBias')

        box = layout.box()
        box.label(text="Blur Variance Shadows")
        box.prop(ob.data, 'shadowBlurScale')
        box.prop(ob.data, 'shadowBlurBoxOffset')

        layout.prop(ob.data, 'autoAnimate')
