add_subdirectory(Console EXCLUDE_FROM_ALL)
add_subdirectory(NativeWindow EXCLUDE_FROM_ALL)
add_subdirectory(ScriptLoader EXCLUDE_FROM_ALL)
add_subdirectory(XMLHttpRequest EXCLUDE_FROM_ALL)

# Add NativeEngine plugin
# Dependencies: NativeWindow
add_subdirectory(NativeEngine EXCLUDE_FROM_ALL)
