set(SOURCES
    "Include/Babylon/AppRuntime.h"
    "Source/AppRuntime.cpp"
    "Source/AppRuntime${NAPI_JAVASCRIPT_ENGINE}.cpp"
    "Source/AppRuntime${BABYLON_NATIVE_PLATFORM}.cpp"
    "Source/Common.h"
    "Source/Common${BABYLON_NATIVE_PLATFORM}.cpp"
    "Source/WorkQueue.cpp"
    "Source/WorkQueue.h")

add_library(AppRuntime ${SOURCES})

target_include_directories(AppRuntime PRIVATE "Include/Babylon")
target_include_directories(AppRuntime INTERFACE "Include")

target_link_libraries(AppRuntime
    PRIVATE arcana
    PUBLIC JsRuntime)

target_compile_definitions(AppRuntime
    PRIVATE NOMINMAX)

set_property(TARGET AppRuntime PROPERTY FOLDER Core)
    
