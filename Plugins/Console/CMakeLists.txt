add_library(Console INTERFACE)
target_include_directories(Console INTERFACE "include")
target_link_libraries(Console INTERFACE napi)
