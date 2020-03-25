add_library(Console INTERFACE)
target_include_directories(Console INTERFACE "include")
target_link_to_dependencies(Console INTERFACE napi)
