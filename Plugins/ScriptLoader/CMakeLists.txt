set(SOURCES 
    "Include/Babylon/ScriptLoader.h"
    "Source/ScriptLoader.cpp")

add_library(ScriptLoader ${SOURCES})

target_include_directories(ScriptLoader PRIVATE "Include/Babylon")
target_include_directories(ScriptLoader INTERFACE "Include")

target_link_libraries(ScriptLoader 
    PUBLIC JsRuntime
    PRIVATE arcana
    PRIVATE BabylonNativeUtils)

set_property(TARGET ScriptLoader PROPERTY FOLDER Plugins/Babylon)
