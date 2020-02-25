set(SOURCES 
    "Include/Babylon/XMLHttpRequest.h"
    "Source/XMLHttpRequest.cpp"
    "Source/XMLHttpRequest.h"
    "Source/XMLHttpRequest${BABYLON_NATIVE_PLATFORM}.cpp")

add_library(XMLHttpRequest ${SOURCES})

target_include_directories(XMLHttpRequest PUBLIC "Include")

target_link_libraries(XMLHttpRequest 
    PUBLIC JsRuntime
    PRIVATE arcana
    PRIVATE BabylonNativeUtils)

if(WINDOWS_STORE)
    target_link_libraries(XMLHttpRequest
        PUBLIC "Kernel32.lib")
endif()

set_property(TARGET XMLHttpRequest PROPERTY FOLDER Plugins/Babylon)
