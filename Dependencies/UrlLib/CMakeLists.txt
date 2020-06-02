if(ANDROID)
    set(ADDITIONAL_SOURCES
        "Source/Android/UrlRequest.cpp")
    set(ADDITIONAL_LIBRARIES
        PRIVATE AndroidExtensions)
elseif(APPLE)
    set(ADDITIONAL_SOURCES
        "Source/Apple/UrlRequest.mm")
elseif(UNIX)
    set(ADDITIONAL_SOURCES
        "Source/Unix/UrlRequest.cpp")
    set(ADDITIONAL_LIBRARIES
        PRIVATE curl)
elseif(WIN32)
    set(ADDITIONAL_SOURCES
        "Source/Windows/UrlRequest.cpp")
    if(NOT WINDOWS_STORE)
        set(ADDITIONAL_LIBRARIES
            PUBLIC onecoreuap.lib)
    endif()
else()
    message(FATAL_ERROR "Unrecognized platform: ${CMAKE_SYSTEM_NAME}")
endif()

set(SOURCES
    "Include/UrlLib/UrlLib.h"
    "Source/Shared/UrlRequest.h"
    ${ADDITIONAL_SOURCES})

add_library(UrlLib ${SOURCES})
warnings_as_errors(UrlLib)

target_include_directories(UrlLib PUBLIC "Include")
target_include_directories(UrlLib PRIVATE "Source")

target_link_libraries(UrlLib
    PUBLIC arcana
    ${ADDITIONAL_LIBRARIES})

source_group(TREE ${CMAKE_CURRENT_SOURCE_DIR} FILES ${SOURCES})
