set(SOURCES
    "Source/Shared/InputManager.cpp"
    "Source/Shared/InputManager.h")
if(BABYLON_NATIVE_PLATFORM STREQUAL "Win32")
    set(SOURCES
        ${SOURCES}
        "Source/Win32/App.cpp"
        "Source/Win32/App.h"
        "Source/Win32/App.ico"
        "Source/Win32/App.rc"
        "Source/Win32/Resource.h"
        "Source/Win32/small.ico"
        "Source/Win32/targetver.h")
elseif(BABYLON_NATIVE_PLATFORM STREQUAL "UWP")
    set(SOURCES
        ${SOURCES}
        "Source/UWP/App.cpp"
        "Source/UWP/App.h")
endif()

set(WIN32_EXECUTABLE TRUE)
add_executable(TestApp WIN32 ${SOURCES})

target_compile_definitions(TestApp PRIVATE UNICODE)
target_compile_definitions(TestApp PRIVATE _UNICODE)

target_include_directories(TestApp PRIVATE "Source")

target_link_libraries(TestApp PRIVATE Library)

macro(copy_resources TGT SRC DST)
    add_custom_command(TARGET ${TGT} POST_BUILD COMMAND ${CMAKE_COMMAND} -E copy_directory ${SRC} $<TARGET_FILE_DIR:${TGT}>/${DST})
endmacro(copy_resources)
copy_resources(TestApp "${CMAKE_SOURCE_DIR}/Library/Source/Scripts" Scripts)
copy_resources(TestApp "${CMAKE_SOURCE_DIR}/TestApp/Source/Scripts" Scripts)

foreach(dependency ${BABYLON_NATIVE_DEPENDENCIES})
    add_custom_command(TARGET TestApp POST_BUILD COMMAND ${CMAKE_COMMAND} -E copy_if_different ${dependency} $<TARGET_FILE_DIR:TestApp>)
endforeach(dependency)
