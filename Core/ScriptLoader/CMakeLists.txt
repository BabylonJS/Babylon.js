set(SOURCES
    "Include/Babylon/ScriptLoader.h"
    "Source/ScriptLoader.cpp")

add_library(ScriptLoader ${SOURCES})
warnings_as_errors(ScriptLoader)

target_include_directories(ScriptLoader PUBLIC "Include")

target_link_to_dependencies(ScriptLoader
    PUBLIC napi
    PRIVATE arcana
    PRIVATE UrlLib)

set_property(TARGET ScriptLoader PROPERTY FOLDER Core)
source_group(TREE ${CMAKE_CURRENT_SOURCE_DIR} FILES ${SOURCES})
