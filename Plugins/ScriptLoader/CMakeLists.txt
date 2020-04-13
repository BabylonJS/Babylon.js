set(SOURCES
    "Include/Babylon/ScriptLoader.h"
    "Source/ScriptLoader.cpp")

add_library(ScriptLoader ${SOURCES})

target_include_directories(ScriptLoader PRIVATE "Include/Babylon")
target_include_directories(ScriptLoader INTERFACE "Include")

target_link_to_dependencies(ScriptLoader
    PUBLIC napi
    PRIVATE arcana
    PRIVATE UrlLib)

set_property(TARGET ScriptLoader PROPERTY FOLDER Plugins)
source_group(TREE ${CMAKE_CURRENT_SOURCE_DIR} FILES ${SOURCES})
