set(SOURCES 
    "Include/Babylon/Plugins/NativeInput.h"
    "Source/NativeInput.cpp"
    "Source/NativeInput.h"
    "Source/DeviceInputSystem.cpp"
    "Source/DeviceInputSystem.h")

add_library(NativeInput ${SOURCES})
warnings_as_errors(NativeInput)

target_include_directories(NativeInput PUBLIC "Include")

target_link_to_dependencies(NativeInput
    PUBLIC JsRuntime
    PRIVATE arcana)

set_property(TARGET NativeInput PROPERTY FOLDER Plugins)
source_group(TREE ${CMAKE_CURRENT_SOURCE_DIR} FILES ${SOURCES})
