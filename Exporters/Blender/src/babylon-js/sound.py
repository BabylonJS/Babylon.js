from .package_level import *

import bpy
#===============================================================================
class Sound:
    def __init__(self, name, autoplay, loop, connectedMesh = None):
        self.name = name;
        self.autoplay = autoplay
        self.loop = loop
        if connectedMesh != None:
            self.connectedMeshId = connectedMesh.name
            self.maxDistance = connectedMesh.data.maxSoundDistance
# - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
    def to_scene_file(self, file_handler):
        file_handler.write('{')
        write_string(file_handler, 'name', self.name, True)
        write_bool(file_handler, 'autoplay', self.autoplay)
        write_bool(file_handler, 'loop', self.loop)

        if hasattr(self, 'connectedMeshId'):
            write_string(file_handler, 'connectedMeshId', self.connectedMeshId)
            write_float(file_handler, 'maxDistance', self.maxDistance)
        file_handler.write('}')