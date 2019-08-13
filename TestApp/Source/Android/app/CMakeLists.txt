cmake_minimum_required(VERSION 3.6)
# set targetPlatform, will be passed in from gradle when this sample is completed
# openGL Supportability
# platform         status
#   (0 12)           ES2/ES3 not supported
#   [12, 18)         ES2 only; for ES3, app do dynamic load/detection
#                    this applies to the situations that:
#                        - minimum API is set to less than 18. In this case
#                          there is no ES3 header/lib support inside NDK
#                        - the built APK might be running on newer API phones
#                    with dynamic loading of ES3, the same APK would still be able
#                    to use ES3. Otherwise, app would stuck with ES2 even phone is
#                    is newer than the minimum API level (for example, Android-27 etc).
#
#   [18, 24)         ES2 & ES3
#                    If app is built to only support API-18 or later,
#                    set minimum api level to 18 is good enough, NDK supprts ES3
#                    with the right header and lib files. No need to use ES3 dynamic
#                    detection.
#   [24, infinite)   ES2 & ES3 & Vulkan

set(CMAKE_C_FLAGS "${CMAKE_C_FLAGS} -Wall")
set(OPENGL_LIB GLESv3)
set(CMAKE_CXX_STANDARD 14)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_CXX_EXTENSIONS OFF)
set(ANDROID_STL "c++_shared")
set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} -std=c++17 -latomic")


list(APPEND CMAKE_MODULE_PATH "${CMAKE_CURRENT_LIST_DIR}/src/")

add_library(BabylonNativeJNI SHARED
            src/main/cpp/BabylonNativeJNI.cpp
            ${CMAKE_CURRENT_LIST_DIR}/../../../../Library/Dependencies/napi/source/js_native_api_v8.cc
            ${CMAKE_CURRENT_LIST_DIR}/../../../../Library/Dependencies/napi/source/env_v8.cc
            ${CMAKE_CURRENT_LIST_DIR}/../../../../Library/Dependencies/napi/source/env.cc
            ${CMAKE_CURRENT_LIST_DIR}/../../Shared/InputManager.cpp
         )

target_compile_definitions(BabylonNativeJNI PUBLIC NODE_ADDON_API_DISABLE_DEPRECATED)

target_include_directories(BabylonNativeJNI
        PRIVATE
        ${CMAKE_CURRENT_LIST_DIR}/../../../../Library/Include
        ${CMAKE_CURRENT_LIST_DIR}/../../../../Library/Dependencies/v8/include
        ${CMAKE_CURRENT_LIST_DIR}/../../../../Library/Dependencies/napi/include
        ${CMAKE_CURRENT_LIST_DIR}/../../Shared
        )

add_definitions(-DANDROID_STL=c++_shared)

target_link_libraries(BabylonNativeJNI
        ${OPENGL_LIB}
        android
        EGL
        log
        -lz
        ${CMAKE_CURRENT_LIST_DIR}/../../../../build/Android_${CMAKE_ANDROID_ARCH_ABI}/libLibrary.a # BabylonNative
        ${CMAKE_CURRENT_LIST_DIR}/../../../../build/Library/Dependencies/bgfx.cmake/libbgfx.a
        ${CMAKE_CURRENT_LIST_DIR}/../../../../build/Library/Dependencies/bgfx.cmake/libbimg.a
        ${CMAKE_CURRENT_LIST_DIR}/../../../../build/Library/Dependencies/bgfx.cmake/libbx.a
        ${CMAKE_CURRENT_LIST_DIR}/../../../../build/Library/Dependencies/bgfx.cmake/libedtaa3.a
        ${CMAKE_CURRENT_LIST_DIR}/../../../../build/Library/Dependencies/bgfx.cmake/libetc1.a
        ${CMAKE_CURRENT_LIST_DIR}/../../../../build/Library/Dependencies/bgfx.cmake/libetc2.a
        ${CMAKE_CURRENT_LIST_DIR}/../../../../build/Library/Dependencies/bgfx.cmake/libiqa.a
        ${CMAKE_CURRENT_LIST_DIR}/../../../../build/Library/Dependencies/bgfx.cmake/libnvtt.a
        ${CMAKE_CURRENT_LIST_DIR}/../../../../build/Library/Dependencies/bgfx.cmake/libpvrtc.a
        ${CMAKE_CURRENT_LIST_DIR}/../../../../build/Library/Dependencies/bgfx.cmake/libsquish.a
        ${CMAKE_CURRENT_LIST_DIR}/../../../../build/Library/Dependencies/bgfx.cmake/libastc.a
        ${CMAKE_CURRENT_LIST_DIR}/../../../../build/Library/Dependencies/bgfx.cmake/libastc-codec.a
        ${CMAKE_CURRENT_LIST_DIR}/../../../../build/Library/Dependencies/SPIRV-Cross/libspirv-cross-core.a
        ${CMAKE_CURRENT_LIST_DIR}/../../../../build/Library/Dependencies/SPIRV-Cross/libspirv-cross-glsl.a
        ${CMAKE_CURRENT_LIST_DIR}/../../../../build/Library/Dependencies/curl/lib/libcurl.a
        ${CMAKE_CURRENT_LIST_DIR}/src/main/jniLibs/${CMAKE_ANDROID_ARCH_ABI}/libv8.cr.so
        ${CMAKE_CURRENT_LIST_DIR}/src/main/jniLibs/${CMAKE_ANDROID_ARCH_ABI}/libv8_libplatform.cr.so
        ${CMAKE_CURRENT_LIST_DIR}/src/main/jniLibs/${CMAKE_ANDROID_ARCH_ABI}/libc++_shared.so
        m)
