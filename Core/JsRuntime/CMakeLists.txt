set(SOURCES
    "Include/Babylon/JsRuntime.h"
    "Source/JsRuntime.cpp")

add_library(JsRuntime ${SOURCES})
warnings_as_errors(JsRuntime)

target_include_directories(JsRuntime PRIVATE "Include/Babylon")
target_include_directories(JsRuntime INTERFACE "Include")

target_link_to_dependencies(JsRuntime
    PUBLIC napi)

set_property(TARGET JsRuntime PROPERTY FOLDER Core)
source_group(TREE ${CMAKE_CURRENT_SOURCE_DIR} FILES ${SOURCES})
