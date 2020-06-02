set(SOURCES
    "Include/Babylon/Plugins/NativeWindow.h"
    "Source/NativeWindow.h"
    "Source/NativeWindow.cpp")

add_library(NativeWindow ${SOURCES})
warnings_as_errors(NativeWindow)

target_include_directories(NativeWindow
    PUBLIC "Include")

target_link_to_dependencies(NativeWindow 
    PUBLIC napi
    PRIVATE arcana
    PRIVATE JsRuntime)

set_property(TARGET NativeWindow PROPERTY FOLDER Plugins)
source_group(TREE ${CMAKE_CURRENT_SOURCE_DIR} FILES ${SOURCES})

add_library(NativeWindowInternal INTERFACE)
target_include_directories(NativeWindowInternal INTERFACE "Source")
target_link_to_dependencies(NativeWindowInternal
    INTERFACE NativeWindow
    INTERFACE JsRuntime)
