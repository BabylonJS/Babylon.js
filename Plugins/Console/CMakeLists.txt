set(SOURCES
    "Include/Babylon/Console.h"
    "Source/Console.cpp")

add_library(Console ${SOURCES})

target_include_directories(Console PUBLIC "Include")

target_link_to_dependencies(Console PUBLIC napi)

set_property(TARGET Console PROPERTY FOLDER Plugins)
source_group(TREE ${CMAKE_CURRENT_SOURCE_DIR} FILES ${SOURCES})
