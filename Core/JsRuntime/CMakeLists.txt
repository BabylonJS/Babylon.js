set(SOURCES
    "Include/Babylon/JsRuntime.h"
    "Source/JsRuntime.cpp")

add_library(JsRuntime ${SOURCES})

target_include_directories(JsRuntime PRIVATE "Include/Babylon")
target_include_directories(JsRuntime INTERFACE "Include")

target_link_libraries(JsRuntime
    PUBLIC napi)

set_property(TARGET JsRuntime PROPERTY FOLDER Core)
