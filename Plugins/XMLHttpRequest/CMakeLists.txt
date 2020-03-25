if(APPLE)
    set(SOURCES 
        "Include/Babylon/XMLHttpRequestApple.h"
        "Source/XMLHttpRequestApple.mm")

    # CLANG_ENABLE_OBJC_WEAK = YES
    set_source_files_properties(
        ${SOURCES}
        PROPERTIES
        COMPILE_FLAGS -fobjc-weak
    )
else()
    set(SOURCES 
        "Include/Babylon/XMLHttpRequest.h"
        "Source/XMLHttpRequest.cpp"
        "Source/XMLHttpRequest.h"
        "Source/XMLHttpRequest${BABYLON_NATIVE_PLATFORM}.cpp")
endif()

add_library(XMLHttpRequest ${SOURCES})

target_include_directories(XMLHttpRequest PUBLIC "Include")

target_link_to_dependencies(XMLHttpRequest 
    PUBLIC JsRuntime
    PRIVATE arcana
    PRIVATE BabylonNativeUtils)

if(WINDOWS_STORE)
    target_link_to_dependencies(XMLHttpRequest
        PUBLIC "Kernel32.lib")
endif()

set_property(TARGET XMLHttpRequest PROPERTY FOLDER Plugins)
source_group(TREE ${CMAKE_CURRENT_SOURCE_DIR} FILES ${SOURCES})
