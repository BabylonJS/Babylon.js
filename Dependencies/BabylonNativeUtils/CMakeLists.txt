set(SOURCES
    "Include/Babylon/NetworkUtils.h"
    "Include/Babylon/TicketedCollection.h"
    "Source/NetworkUtils.cpp")

add_library(BabylonNativeUtils ${SOURCES})

target_include_directories(BabylonNativeUtils PRIVATE "Include/Babylon")
target_include_directories(BabylonNativeUtils INTERFACE "Include")

target_link_libraries(BabylonNativeUtils
    PUBLIC arcana
    PRIVATE libcurl)
