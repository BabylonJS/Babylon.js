bl_info = {
    'name': 'Babylon.js',
    'author': 'David Catuhe, Jeff Palmer',
    'version': (5, 0, 7),
    'blender': (2, 76, 0),
    'location': 'File > Export > Babylon.js (.babylon)',
    'description': 'Export Babylon.js scenes (.babylon)',
    'wiki_url': 'https://github.com/BabylonJS/Babylon.js/tree/master/Exporters/Blender',
    'tracker_url': '',
    'category': 'Babylon.JS'}

# allow module to be changed during a session (dev purposes)
if "bpy" in locals():
    print('Reloading TOB exporter')
    import imp
    imp.reload(animation)
    imp.reload(armature)
    imp.reload(camera)
    imp.reload(exporter_settings_panel)
    imp.reload(f_curve_animatable)
    imp.reload(json_exporter)
    imp.reload(light_shadow)
    imp.reload(logger)
    imp.reload(material)
    imp.reload(mesh)
    imp.reload(package_level)
    imp.reload(sound)
    imp.reload(world)
else:
    from . import animation
    from . import armature
    from . import camera
    from . import exporter_settings_panel
    from . import f_curve_animatable
    from . import json_exporter
    from . import light_shadow
    from . import logger
    from . import material
    from . import mesh
    from . import package_level
    from . import sound
    from . import world

import bpy
from bpy_extras.io_utils import ExportHelper, ImportHelper
#===============================================================================
def register():
    bpy.utils.register_module(__name__)
    bpy.types.INFO_MT_file_export.append(menu_func)
    
def unregister():
    bpy.utils.unregister_module(__name__)
    bpy.types.INFO_MT_file_export.remove(menu_func)

# Registration the calling of the INFO_MT_file_export file selector
def menu_func(self, context):
    from .package_level import get_title
    # the info for get_title is in this file, but getting it the same way as others
    self.layout.operator(JsonMain.bl_idname, get_title())

if __name__ == '__main__':
    unregister()
    register()
#===============================================================================
class JsonMain(bpy.types.Operator, ExportHelper):
    bl_idname = 'bjs.main'
    bl_label = 'Export Babylon.js scene' # used on the label of the actual 'save' button
    filename_ext = '.babylon'            # used as the extension on file selector

    filepath = bpy.props.StringProperty(subtype = 'FILE_PATH') # assigned once the file selector returns
    
    def execute(self, context):
        from .json_exporter import JsonExporter
        from .package_level import get_title, verify_min_blender_version
        
        if not verify_min_blender_version():
            self.report({'ERROR'}, 'version of Blender too old.')
            return {'FINISHED'}
            
        exporter = JsonExporter()
        exporter.execute(context, self.filepath)
        
        if (exporter.fatalError):
            self.report({'ERROR'}, exporter.fatalError)

        elif (exporter.nWarnings > 0):
            self.report({'WARNING'}, 'Processing completed, but ' + str(exporter.nWarnings) + ' WARNINGS were raised,  see log file.')
            
        return {'FINISHED'}