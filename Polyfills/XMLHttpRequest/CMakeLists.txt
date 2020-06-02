set(SOURCES 
    "Include/Babylon/Polyfills/XMLHttpRequest.h"
    "Source/XMLHttpRequest.cpp"
    "Source/XMLHttpRequest.h")

add_library(XMLHttpRequest ${SOURCES})
warnings_as_errors(XMLHttpRequest)

target_include_directories(XMLHttpRequest PUBLIC "Include")

target_link_to_dependencies(XMLHttpRequest
    PUBLIC JsRuntime
    PRIVATE arcana
    PRIVATE UrlLib)

set_property(TARGET XMLHttpRequest PROPERTY FOLDER Polyfills)
source_group(TREE ${CMAKE_CURRENT_SOURCE_DIR} FILES ${SOURCES})
