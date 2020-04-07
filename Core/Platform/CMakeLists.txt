if(ANDROID)
    set(SOURCES
        "Android/Include/Babylon/Platform.h"
        "Android/Source/Platform.cpp")

    add_library(Platform ${SOURCES})

    target_include_directories(Platform PRIVATE "Android/Include")
    target_include_directories(Platform INTERFACE "Android/Include")

    target_link_libraries(Platform PUBLIC JsRuntime)
endif()

