if(BABYLON_NATIVE_PLATFORM STREQUAL "Win32")
    set(SOURCES
        ${SOURCES}
        "Source/Win32/App.cpp"
        "Source/Win32/App.h"
        "Source/Win32/App.ico"
        "Source/Win32/App.rc"
        "Source/Win32/InputManagerWin32.cpp"
        "Source/Win32/InputManagerWin32.h"
        "Source/Win32/Resource.h"
        "Source/Win32/small.ico"
        "Source/Win32/targetver.h")
elseif(BABYLON_NATIVE_PLATFORM STREQUAL "UWP")
    set(SOURCES
        ${SOURCES}
        "Source/UWP/App.cpp"
        "Source/UWP/App.h"
        "Source/UWP/InputManagerUWP.cpp"
        "Source/UWP/InputManagerUWP.h")
endif()

set(WIN32_EXECUTABLE TRUE)
add_executable(BabylonNativeTestApp WIN32 ${SOURCES})

target_compile_definitions(BabylonNativeTestApp PRIVATE UNICODE)
target_compile_definitions(BabylonNativeTestApp PRIVATE _UNICODE)

target_include_directories(BabylonNativeTestApp PRIVATE "Source")

target_link_libraries(BabylonNativeTestApp PRIVATE BabylonNativeLib)

macro(copy_resources TGT SRC DST)
    add_custom_command(TARGET ${TGT} POST_BUILD COMMAND ${CMAKE_COMMAND} -E copy_directory ${SRC} $<TARGET_FILE_DIR:${TGT}>/${DST})
endmacro(copy_resources)
copy_resources(BabylonNativeTestApp "${CMAKE_SOURCE_DIR}/Library/Source/Scripts" Scripts)
copy_resources(BabylonNativeTestApp "${CMAKE_SOURCE_DIR}/TestApp/Source/Scripts" Scripts)
if(BABYLON_NATIVE_JAVASCRIPT_ENGINE STREQUAL "V8")
    copy_resources(BabylonNativeTestApp "${NUGET_PATH}/v8.redist-v141-${ARCH}.7.4.288.26/lib/Release" ".")
endif()