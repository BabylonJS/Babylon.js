set(SOURCES
    "Include/Babylon/NativeWindow.h"
    "Source/NativeWindow.cpp")

add_library(NativeWindow ${SOURCES})

target_include_directories(NativeWindow PRIVATE "Include/Babylon")
target_include_directories(NativeWindow INTERFACE "Include")

target_link_to_dependencies(NativeWindow 
    PRIVATE base-n
    PUBLIC BabylonNativeUtils
    PUBLIC JsRuntime)

set_property(TARGET NativeWindow PROPERTY FOLDER Plugins)
source_group(TREE ${CMAKE_CURRENT_SOURCE_DIR} FILES ${SOURCES})
