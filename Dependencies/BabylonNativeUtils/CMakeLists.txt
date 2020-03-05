if(APPLE)
    set(SOURCES
        "Include/Babylon/NetworkUtils.h"
        "Include/Babylon/TicketedCollection.h"
        "Source/NetworkUtils.mm")
else()
    set(SOURCES
        "Include/Babylon/NetworkUtils.h"
        "Include/Babylon/TicketedCollection.h"
        "Source/NetworkUtils.cpp")
endif()

add_library(BabylonNativeUtils ${SOURCES})

target_include_directories(BabylonNativeUtils PRIVATE "Include/Babylon")
target_include_directories(BabylonNativeUtils INTERFACE "Include")

if(APPLE)
    target_link_libraries(BabylonNativeUtils
        PUBLIC arcana)
else()
    target_link_libraries(BabylonNativeUtils
        PUBLIC arcana
        PRIVATE libcurl)
endif()
