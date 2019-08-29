#include <napi/js_native_api.h>

napi_status napi_close_escapable_handle_scope(napi_env env,
  napi_escapable_handle_scope scope) {
    // stub
    return napi_ok;
}

napi_status napi_create_double(napi_env env,
                               double value,
                               napi_value* result) {
    // stub
    return napi_ok;
}

napi_status napi_create_error(napi_env env,
                              napi_value code,
                              napi_value msg,
                              napi_value* result) {
    // stub
    return napi_ok;
}

napi_status napi_create_reference(napi_env env,
                                  napi_value v,
                                  uint32_t initial_refcount,
                                  napi_ref* result) {
    // stub
    return napi_ok;
}

napi_status napi_create_string_utf8(napi_env env,
                                    const char* str,
                                    size_t length,
                                    napi_value* result) {
    // stub
    return napi_ok;
}

napi_status napi_create_type_error(napi_env env,
                                   napi_value code,
                                   napi_value msg,
                                   napi_value* result) {
    // stub
    return napi_ok;
}

napi_status napi_delete_reference(napi_env env, napi_ref ref) {
    // stub
    return napi_ok;
}

napi_status napi_escape_handle(napi_env env,
                               napi_escapable_handle_scope scope,
                               napi_value escapee,
                               napi_value* result) {
    // stub
    return napi_ok;
}

napi_status napi_get_and_clear_last_exception(napi_env env,
                                              napi_value* result) {
    // stub
    return napi_ok;
}

napi_status napi_get_boolean(napi_env env, bool value, napi_value* result) {
    // stub
    return napi_ok;
}

napi_status napi_get_last_error_info(napi_env env,
                                     const napi_extended_error_info** result) {
    // stub
    return napi_ok;
}

napi_status napi_get_named_property(napi_env env,
                                    napi_value object,
                                    const char* utf8name,
                                    napi_value* result) {
    // stub
    return napi_ok;
}

napi_status napi_get_reference_value(napi_env env,
                                     napi_ref ref,
                                     napi_value* result) {
    // stub
    return napi_ok;
}

napi_status napi_get_undefined(napi_env env, napi_value* result) {
    // stub
    return napi_ok;
}

napi_status napi_get_value_string_utf8(napi_env env,
                                       napi_value value,
                                       char* buf,
                                       size_t bufsize,
                                       size_t* result) {
    // stub
    return napi_ok;
}

napi_status napi_is_exception_pending(napi_env env, bool* result) {
    // stub
    return napi_ok;
}

napi_status napi_open_escapable_handle_scope(napi_env env,
  napi_escapable_handle_scope* result) {
    // stub
    return napi_ok;
}

napi_status napi_wrap(napi_env env,
                      napi_value js_object,
                      void* native_object,
                      napi_finalize finalize_cb,
                      void* finalize_hint,
                      napi_ref* result) {
    // stub
    return napi_ok;
}

napi_status napi_create_function(napi_env env,
                                 const char* utf8name,
                                 size_t length,
                                 napi_callback cb,
                                 void* callback_data,
                                 napi_value* result) {
    // stub
    return napi_ok;
}

napi_status napi_call_function(napi_env env,
                               napi_value recv,
                               napi_value func,
                               size_t argc,
                               const napi_value* argv,
                               napi_value* result) {

  return napi_ok;
}

napi_status napi_close_handle_scope(napi_env env, napi_handle_scope) {
  return napi_ok;
}

napi_status napi_coerce_to_string(napi_env env,
                                  napi_value v,
                                  napi_value* result) {
  return napi_ok;
}

napi_status napi_create_array_with_length(napi_env env,
                                          size_t length,
                                          napi_value* result) {
  return napi_ok;
}

napi_status napi_create_string_utf16(napi_env env,
                                     const char16_t* str,
                                     size_t length,
                                     napi_value* result) {
  return napi_ok;
}

napi_status napi_create_symbol(napi_env env,
                               napi_value description,
                               napi_value* result) {
  return napi_ok;
}

napi_status napi_define_class(napi_env env,
                              const char* utf8name,
                              size_t length,
                              napi_callback cb,
                              void* data,
                              size_t property_count,
                              const napi_property_descriptor* properties,
                              napi_value* result) {
  return napi_ok;
}

napi_status napi_get_array_length(napi_env env,
                                  napi_value v,
                                  uint32_t* result) {

  return napi_ok;
}

napi_status napi_get_arraybuffer_info(napi_env env,
                                      napi_value arraybuffer,
                                      void** data,
                                      size_t* byte_length) {
  return napi_ok;
}


napi_status napi_get_cb_info(
    napi_env env,               // [in] NAPI environment handle
    napi_callback_info cbinfo,  // [in] Opaque callback-info handle
    size_t* argc,      // [in-out] Specifies the size of the provided argv array
                       // and receives the actual count of args.
    napi_value* argv,  // [out] Array of values
    napi_value* this_arg,  // [out] Receives the JS 'this' arg for the call
    void** data) {         // [out] Receives the data pointer for the callback.
  
  return napi_ok;
}

napi_status napi_get_element(napi_env env,
                             napi_value object,
                             uint32_t i,
                             napi_value* result) {
  return napi_ok;
}

napi_status napi_get_global(napi_env env, napi_value* result) {

  return napi_ok;
}

napi_status napi_get_new_target(napi_env env,
                                napi_callback_info cbinfo,
                                napi_value* result) {
  return napi_ok;
}

napi_status napi_get_null(napi_env env, napi_value* result) {

  return napi_ok;
}

napi_status napi_get_typedarray_info(napi_env env,
                                     napi_value typedarray,
                                     napi_typedarray_type* type,
                                     size_t* length,
                                     void** data,
                                     napi_value* arraybuffer,
                                     size_t* byte_offset) {
  return napi_ok;
}                                         

napi_status napi_get_value_bool(napi_env env, napi_value v, bool* result) {
  return napi_ok;
}

napi_status napi_get_value_double(napi_env env, napi_value v, double* result) {

  return napi_ok;
}

napi_status napi_get_value_int32(napi_env env, napi_value v, int32_t* result) {

  return napi_ok;
}

napi_status napi_get_value_uint32(napi_env env,
                                  napi_value v,
                                  uint32_t* result) {
  return napi_ok;
}

napi_status napi_run_script(napi_env env,
                            napi_value script,
                            const char* sourceUrl,
                            napi_value* result) {
  return napi_ok;
}

napi_status napi_typeof(napi_env env, napi_value vv, napi_valuetype* result) {

  return napi_ok;
}

napi_status napi_unwrap(napi_env env, napi_value js_object, void** result) {
  return napi_ok;
}

napi_status napi_throw_type_error(napi_env env,
                                  const char* code,
                                  const char* msg) {
  return napi_ok;
}

napi_status napi_throw(napi_env env, napi_value error) {
  return napi_ok;
}

napi_status napi_strict_equals(napi_env env,
                               napi_value lhs,
                               napi_value rhs,
                               bool* result) {

  return napi_ok;
}

napi_status napi_set_named_property(napi_env env,
                                    napi_value object,
                                    const char* utf8name,
                                    napi_value value) {
  return napi_ok;
}

napi_status napi_set_element(napi_env env,
                             napi_value object,
                             uint32_t i,
                             napi_value v) {
  return napi_ok;
}

napi_status napi_open_handle_scope(napi_env env, napi_handle_scope* result) {
  return napi_ok;
}

napi_status napi_new_instance(napi_env env,
                              napi_value constructor,
                              size_t argc,
                              const napi_value* argv,
                              napi_value* result) {
  return napi_ok;
}


napi_status napi_define_properties(napi_env env,
                                   napi_value object,
                                   size_t property_count,
                                   const napi_property_descriptor* properties) {
  return napi_ok;
}

napi_status napi_create_external(napi_env env,
                                 void* data,
                                 napi_finalize finalize_cb,
                                 void* finalize_hint,
                                 napi_value* result) {
  return napi_ok;
}

napi_status napi_get_value_external(napi_env env, napi_value v, void** result) {
  return napi_ok;
}

napi_status napi_create_arraybuffer(napi_env env,
                                    size_t byte_length,
                                    void** data,
                                    napi_value* result) {
  return napi_ok;
}
