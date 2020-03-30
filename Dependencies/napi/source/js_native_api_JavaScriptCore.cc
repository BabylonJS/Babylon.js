#include <napi/js_native_api.h>
#include <napi/js_native_api_types.h>
#include "JavaScriptCore/JavaScript.h"
#include "js_native_api_JavaScriptCore.h"
#include <string>
#include <vector>
#include <map>
#include <napi/napi.h>

#include <algorithm>
#include <cassert>

struct FunctionTableEntry {
  napi_callback cb;
  void* data;
};

struct FunctionTableProperty {
  napi_callback getter;
  napi_callback setter;
  void* data;
};

struct FunctionTable {
  napi_env env;
  std::vector<FunctionTableEntry> table;
  std::map<std::string, FunctionTableProperty> properties;
};

struct ClassTable {
  napi_callback cb;
  void* data;
  JSClassRef classRef;
  napi_env env;
  FunctionTable FunctionTable;
};

struct CallbackInfo {
  napi_value newTarget;
  napi_value thisArg;
  napi_value* argv;
  void* data;
  uint16_t argc;
  bool isConstructCall{ false };
};

struct RefInfo {
  JSValueRef value;
  uint32_t count;
};

std::map<JSObjectRef, ClassTable*> constructorCB;
std::map<JSValueRef, FunctionTable*> FunctionTables;

void DumpException(napi_env env, JSValueRef exception) {
  char errorStr[1024];
  size_t errorStrSize{ 0 };

  if (!JSValueIsNull(env->m_globalContext, exception)) {
    // Getting error string
    if (JSValueIsString(env->m_globalContext, exception)) {
      OpaqueJSValue* ncstr = const_cast<OpaqueJSValue*>(exception);
      /*size_t length =*/ JSStringGetUTF8CString(reinterpret_cast<JSStringRef>(ncstr), errorStr, sizeof(errorStr));
    } else {
      OpaqueJSValue *exceptionValue = const_cast<OpaqueJSValue*>(exception);
      napi_get_value_string_utf8(env, reinterpret_cast<napi_value>(exceptionValue), errorStr, sizeof(errorStr), &errorStrSize);
    }
  }
}

std::string GetUTF8String(JSStringRef string) {
  size_t maxSize = JSStringGetMaximumUTF8CStringSize(string);
  std::string str(maxSize - 1, '\0');
  size_t size = JSStringGetUTF8CString(string, str.data(), maxSize);
  str.resize(size - 1);
  return std::move(str);
}

napi_status napi_get_value_bool(napi_env env, napi_value v, bool* result) {
  bool boolean = JSValueToBoolean(env->m_globalContext, reinterpret_cast<JSValueRef>(v));
  *result = boolean;
  return napi_ok;
}

napi_status napi_get_value_double(napi_env env, napi_value v, double* result) {
  double dblValue = JSValueToNumber(env->m_globalContext, reinterpret_cast<JSValueRef>(v), nullptr);
  *result = dblValue;
  return napi_ok;
}

napi_status napi_get_value_int32(napi_env env, napi_value v, int32_t* result) {
  double dblValue = JSValueToNumber(env->m_globalContext, reinterpret_cast<JSValueRef>(v), nullptr);
  *result = int32_t(dblValue);
  return napi_ok;
}

napi_status napi_get_value_uint32(napi_env env,
                  napi_value v,
                  uint32_t* result) {
  double dblValue = JSValueToNumber(env->m_globalContext, reinterpret_cast<JSValueRef>(v), nullptr);
  *result = uint32_t(dblValue);
  return napi_ok;
}

napi_status napi_create_double(napi_env env,
                 double value,
                 napi_value* result) {
  OpaqueJSValue* jsValue = const_cast<OpaqueJSValue*>(JSValueMakeNumber(env->m_globalContext, value));
  *result = reinterpret_cast<napi_value>(jsValue);
  return napi_ok;
}

napi_status napi_create_error(napi_env env,
                napi_value code,
                napi_value msg,
                napi_value* result) {
  JSObjectRef errorObject = JSObjectMakeError(env->m_globalContext, 0, nullptr, nullptr);
  *result = reinterpret_cast<napi_value>(errorObject);
  return napi_ok;
}

napi_status napi_create_reference(napi_env env,
                  napi_value v,
                  uint32_t initial_refcount,
                  napi_ref* result) {
  auto value = reinterpret_cast<JSValueRef>(v);
  auto info = new RefInfo{ value, initial_refcount };
  if (info->count != 0)
  {
    JSValueProtect(env->m_globalContext, value);
  }
  *result = reinterpret_cast<napi_ref>(info);
  return napi_ok;
}

napi_status napi_delete_reference(napi_env env, napi_ref ref) {
  auto info = reinterpret_cast<RefInfo*>(ref);
  if (info->count != 0) {
    JSValueUnprotect(env->m_globalContext, info->value);
  }
  delete info;
  return napi_ok;
}

napi_status napi_reference_ref(napi_env env, napi_ref ref, uint32_t* result) {
  auto info = reinterpret_cast<RefInfo*>(ref);
  if (info->count++ == 0) {
    JSValueProtect(env->m_globalContext, info->value);
  }
  if (result != nullptr) {
    *result = info->count;
  }
  return napi_ok;
}

napi_status napi_reference_unref(napi_env env, napi_ref ref, uint32_t* result) {
  auto info = reinterpret_cast<RefInfo*>(ref);
  if (--info->count == 0) {
    JSValueUnprotect(env->m_globalContext, info->value);
  }
  if (result != nullptr) {
    *result = info->count;
  }
  return napi_ok;
}

napi_status napi_get_reference_value(napi_env env,
                   napi_ref ref,
                   napi_value* result) {
  auto info = reinterpret_cast<RefInfo*>(ref);
  if (info->count == 0) {
    *result = nullptr;
  } else {
    *result = reinterpret_cast<napi_value>(const_cast<OpaqueJSValue*>(info->value));
  }
  return napi_ok;
}

napi_status napi_create_string_utf8(napi_env env,
                  const char* str,
                  size_t length,
                  napi_value* result) {
  JSStringRef statement = JSStringCreateWithUTF8CString(str);
  auto v = JSValueMakeString(env->m_globalContext, statement);
  JSStringRelease(statement);
  *result = reinterpret_cast<napi_value>(const_cast<OpaqueJSValue*>(v));
  return napi_ok;
}

napi_status napi_create_type_error(napi_env env,
                   napi_value code,
                   napi_value msg,
                   napi_value* result) {
  assert(0);
  return napi_ok;
}

napi_status napi_get_and_clear_last_exception(napi_env env,
                        napi_value* result) {
  assert(0);
  return napi_ok;
}

napi_status napi_get_boolean(napi_env env, bool value, napi_value* result) {

  OpaqueJSValue* jsValue = const_cast<OpaqueJSValue*>(JSValueMakeBoolean(env->m_globalContext, value));
  *result = reinterpret_cast<napi_value>(jsValue);
  return napi_ok;
}

napi_status napi_get_last_error_info(napi_env env,
                  const napi_extended_error_info** result) {
  assert(0);
  return napi_ok;
}

napi_status napi_get_named_property(napi_env env,
                  napi_value object,
                  const char* utf8name,
                  napi_value* result) {
  auto context = env->m_globalContext;
  JSStringRef propertyName = JSStringCreateWithUTF8CString(utf8name);
  const OpaqueJSValue* jsValue = JSObjectGetProperty(context, reinterpret_cast<JSObjectRef>(object), propertyName, nullptr);
  JSStringRelease(propertyName);
  *result = reinterpret_cast<napi_value>(const_cast<OpaqueJSValue*>(jsValue));
  return napi_ok;
}

napi_status napi_get_undefined(napi_env env, napi_value* result) {
  OpaqueJSValue* jsValue = const_cast<OpaqueJSValue*>(JSValueMakeUndefined(env->m_globalContext));
  *result = reinterpret_cast<napi_value>(jsValue);
  return napi_ok;
}

napi_status napi_get_value_string_utf8(napi_env env,
                     napi_value value,
                     char* buf,
                     size_t bufsize,
                     size_t* result) {
  JSStringRef stringRef = JSValueToStringCopy(env->m_globalContext, reinterpret_cast<JSValueRef>(value), nullptr);
  if (!buf) {
    *result = GetUTF8String(stringRef).size();
    return napi_ok;
  }
  size_t size = JSStringGetUTF8CString(stringRef, buf, bufsize);
  if (result) {
    // JSStringGetUTF8CString returns size with null terminator.
    *result = size - 1;
  }
  JSStringRelease(stringRef);
  return napi_ok;
}

napi_status napi_is_exception_pending(napi_env env, bool* result) {
  // stub
  *result = false;
  return napi_ok;
}

JSValueRef RaiseException(JSContextRef ctx, JSValueRef* exception, const char* exceptionString)
{
  JSStringRef statement = JSStringCreateWithUTF8CString(exceptionString);
  auto value = JSValueMakeString(ctx, statement);
  JSStringRelease(statement);
  *exception = value;
  return value;
}

JSValueRef JSCFunctionCallback(JSContextRef ctx, JSObjectRef function, JSObjectRef thisObject, size_t argumentCount, const JSValueRef arguments[], JSValueRef* exception) {
  auto iter = constructorCB.find(function);
    
  if (iter == constructorCB.end()) {
      return RaiseException(ctx, exception, "JavaScriptCore : constructor not found.");
  }
  ClassTable *cbInfo = iter->second;
    
  if (cbInfo->cb == nullptr) {
    return RaiseException(ctx, exception, "JavaScriptCore : constructor callback is null.");
  }
  
  CallbackInfo callbackInfo;
  callbackInfo.argc = argumentCount;
  OpaqueJSValue** valueRef = const_cast<OpaqueJSValue **>(arguments);
  callbackInfo.argv = reinterpret_cast<napi_value*>(valueRef);
  callbackInfo.data = cbInfo->data;
  callbackInfo.thisArg = reinterpret_cast<napi_value>(thisObject);
  napi_value retValue = cbInfo->cb(cbInfo->env, reinterpret_cast<napi_callback_info>(&callbackInfo));
  
  return reinterpret_cast<JSValueRef>(retValue);
}

napi_status napi_create_function(napi_env env,
                 const char* utf8name,
                 size_t length,
                 napi_callback cb,
                 void* callback_data,
                 napi_value* result) {

  auto context = env->m_globalContext;
  JSStringRef str = JSStringCreateWithUTF8CString(utf8name);
  JSObjectRef function = JSObjectMakeFunctionWithCallback(context, str, JSCFunctionCallback);
  ClassTable* cbInfo = new ClassTable{cb, callback_data, nullptr, env};
  constructorCB[function] = cbInfo;
  *result = reinterpret_cast<napi_value>(function);
  JSStringRelease(str);
  return napi_ok;
}

napi_status napi_call_function(napi_env env,
                 napi_value recv,
                 napi_value func,
                 size_t argc,
                 const napi_value* argv,
                 napi_value* result) {
  auto context = env->m_globalContext;
  
  std::vector<JSValueRef> args(argc + 1);
  args[0] = reinterpret_cast<JSValueRef>(recv);
  for (size_t i = 0; i < argc; i++) {
    args[i + 1] = reinterpret_cast<JSValueRef>(argv[i]);
  }
  JSObjectRef obj = JSValueToObject(context, reinterpret_cast<JSValueRef>(func), nullptr);
    
  assert(JSObjectIsFunction(context, obj));
  JSValueRef jsResult = JSObjectCallAsFunction(context, obj, nullptr, argc + 1, args.data(), nullptr);
  
  if (result != nullptr) {
    *result = reinterpret_cast<napi_value>(const_cast<OpaqueJSValue*>(jsResult));
  }
  return napi_ok;
}

napi_status napi_open_escapable_handle_scope(napi_env env,
                       napi_escapable_handle_scope* result) {
  *result = nullptr;
  return napi_ok;
}

napi_status napi_close_escapable_handle_scope(napi_env env,
                        napi_escapable_handle_scope scope) {
  return napi_ok;
}

napi_status napi_open_handle_scope(napi_env env, napi_handle_scope* result) {
  *result = nullptr;
  return napi_ok;
}

napi_status napi_close_handle_scope(napi_env env, napi_handle_scope) {
  return napi_ok;
}

napi_status napi_escape_handle(napi_env env,
                 napi_escapable_handle_scope scope,
                 napi_value escapee,
                 napi_value* result) {
  *result = escapee;
  return napi_ok;
}

napi_status napi_coerce_to_string(napi_env env,
                  napi_value v,
                  napi_value* result) {
  if (JSValueIsString(env->m_globalContext, reinterpret_cast<JSValueRef>(v))) {
    *result = v;
  } else {
    JSStringRef stringref = JSValueToStringCopy(env->m_globalContext, reinterpret_cast<JSValueRef>(v), nullptr);
    *result = reinterpret_cast<napi_value>(stringref);
  }
  return napi_ok;
}

napi_status napi_create_object(napi_env env, napi_value* result) {
  static JSClassRef classDef = nullptr;
  if (!classDef) {
    JSClassDefinition classDefinition = kJSClassDefinitionEmpty;
    classDefinition.className = "dummyObject";
    classDef = JSClassCreate(&classDefinition);
  }
  JSObjectRef jsObject = JSObjectMake(env->m_globalContext, classDef, nullptr);
  *result = reinterpret_cast<napi_value>(jsObject);
  return napi_ok;
}

napi_status napi_create_array_with_length(napi_env env,
                      size_t length,
                      napi_value* result) {
  std::vector<JSValueRef> values(length);
  for (auto i = 0;i<length;i++) {
    values[i] = JSValueMakeNull(env->m_globalContext);
  }
  JSObjectRef array = JSObjectMakeArray(env->m_globalContext, length, values.data(), nullptr);
  *result = reinterpret_cast<napi_value>(array);
  return napi_ok;
}


napi_status napi_create_typedarray(napi_env env,
                                   napi_typedarray_type type,
                                   size_t length,
                                   napi_value arraybuffer,
                                   size_t byte_offset,
                                   napi_value* result) {
  assert(0);
  return napi_ok;
}

napi_status napi_create_string_utf16(napi_env env,
                   const char16_t* str,
                   size_t length,
                   napi_value* result) {
  auto s = JSStringCreateWithCharacters((const JSChar*)str, length);
  auto v = JSValueMakeString(env->m_globalContext, s);
  JSStringRelease(s);

  *result = reinterpret_cast<napi_value>(const_cast<OpaqueJSValue*>(v));
  return napi_ok;
}

napi_status napi_create_symbol(napi_env env,
                 napi_value description,
                 napi_value* result) {
  *result = nullptr;
  return napi_ok;
}

template<int functionIndex> JSValueRef JSCStaticMethod(JSContextRef ctx, JSObjectRef function, JSObjectRef object, size_t argumentCount, const JSValueRef arguments[], JSValueRef* exception) {
  // vf table
  auto iter = FunctionTables.find(object);
  if (iter == FunctionTables.end()) {
    return RaiseException(ctx, exception, "JavaScriptCore : function not found in table.");
  }
  
  const FunctionTable& table = *iter->second;
  const FunctionTableEntry& entry = table.table[functionIndex];
  
  if (entry.cb == nullptr) {
    return RaiseException(ctx, exception, "JavaScriptCore : function callback is null.");
  }
  CallbackInfo callbackInfo;
  callbackInfo.argc = argumentCount;
  auto jsValueRefs = const_cast<JSValueRef*>(arguments);
  auto jsValues = const_cast<OpaqueJSValue**>(jsValueRefs);
  callbackInfo.argv = reinterpret_cast<napi_value*>(jsValues);
  callbackInfo.thisArg = reinterpret_cast<napi_value>(object);
  callbackInfo.data = entry.data;
  callbackInfo.isConstructCall = false;
  callbackInfo.newTarget = 0;

  napi_value retValue = entry.cb(table.env, reinterpret_cast<napi_callback_info>(&callbackInfo));
  
  return reinterpret_cast<JSValueRef>(retValue);
}

void JSCFinalize(JSObjectRef object) {
  // todo
}

JSObjectRef JSCCallAsConstructor(JSContextRef ctx, JSObjectRef constructor, size_t argumentCount, const JSValueRef arguments[], JSValueRef* exception) {

  auto iter = constructorCB.find(constructor);
  if (iter == constructorCB.end()) {
    return const_cast<OpaqueJSValue*>(RaiseException(ctx, exception, "JavaScriptCore : constructor not found."));
  }
  ClassTable *cbInfo = iter->second;
  
  if (!cbInfo->cb) {
    return const_cast<OpaqueJSValue*>(RaiseException(ctx, exception, "JavaScriptCore : constructor callback is null."));
  }
  
  assert(JSObjectIsConstructor(ctx, constructor));
  OpaqueJSValue* jsValue = const_cast<OpaqueJSValue*>(JSObjectMake(ctx, cbInfo->classRef, nullptr));
  napi_value value = reinterpret_cast<napi_value>(jsValue);
  
  FunctionTables[jsValue] = &cbInfo->FunctionTable;
  
  // callback will wrap the pointer itself
  CallbackInfo callbackInfo;
  callbackInfo.argc = argumentCount;
  auto jsValueRefs = const_cast<JSValueRef*>(arguments);
  auto jsValues = const_cast<OpaqueJSValue**>(jsValueRefs);
  callbackInfo.argv = reinterpret_cast<napi_value*>(jsValues);
  callbackInfo.thisArg = value;
  callbackInfo.data = cbInfo->data;
  callbackInfo.isConstructCall = true;
  cbInfo->cb(cbInfo->env, reinterpret_cast<napi_callback_info>(&callbackInfo));
  
  return jsValue;
}

bool JSCSetProperty(JSContextRef ctx, JSObjectRef object, JSStringRef propertyName, JSValueRef value, JSValueRef* exception)
{
  auto iter = FunctionTables.find(object);
  if (iter == FunctionTables.end()) {
    return RaiseException(ctx, exception, "JavaScriptCore : object not found in function table.");
  }

  auto propertyIter = iter->second->properties.find(GetUTF8String(propertyName));
  if (propertyIter == iter->second->properties.end()) {
     return RaiseException(ctx, exception, "JavaScriptCore : property not found in function table.");
  }
        
  auto prop = propertyIter->second;
    
  if (!prop.setter) {
    return RaiseException(ctx, exception, "JavaScriptCore : setter function is null for the object.");
  }
  napi_value napiValue = reinterpret_cast<napi_value>(const_cast<OpaqueJSValue*>(value));
  CallbackInfo callbackInfo;
  callbackInfo.newTarget = 0;
  callbackInfo.argc = 1;
  callbackInfo.argv = &napiValue;
  callbackInfo.thisArg = reinterpret_cast<napi_value>(object);
  callbackInfo.data = prop.data;
  callbackInfo.isConstructCall = false;
  prop.setter(iter->second->env, reinterpret_cast<napi_callback_info>(&callbackInfo));
  return true;
}

JSValueRef JSCGetProperty(JSContextRef ctx, JSObjectRef object, JSStringRef propertyName, JSValueRef* exception) {
  auto iter = FunctionTables.find(object);

  if (iter == FunctionTables.end()) {
      return RaiseException(ctx, exception, "JavaScriptCore : object not found in function table.");
  }

  auto propertyIter = iter->second->properties.find(GetUTF8String(propertyName));
  if (propertyIter == iter->second->properties.end()) {
    return RaiseException(ctx, exception, "JavaScriptCore : property not found for object in function table.");
  }

  auto prop = propertyIter->second;

  if (!prop.getter) {
    return RaiseException(ctx, exception, "JavaScriptCore : getter function is null for the object.");
  }

  CallbackInfo callbackInfo;
  callbackInfo.newTarget = 0;
  callbackInfo.argc = 0;
  callbackInfo.argv = 0;
  callbackInfo.thisArg = reinterpret_cast<napi_value>(object);
  callbackInfo.data = prop.data;
  callbackInfo.isConstructCall = false;
  napi_value retValue = prop.getter(iter->second->env, reinterpret_cast<napi_callback_info>(&callbackInfo));
  return reinterpret_cast<JSValueRef>(retValue);
}

napi_status napi_define_class(napi_env env,
                const char* utf8name,
                size_t length,
                napi_callback cb,
                void* data,
                size_t property_count,
                const napi_property_descriptor* properties,
                napi_value* result) {
  auto context = env->m_globalContext;
  JSObjectRef globalObj = JSContextGetGlobalObject(env->m_globalContext);
  
  
  JSStringRef str = JSStringCreateWithUTF8CString(utf8name);

  JSClassDefinition classDefinition = kJSClassDefinitionEmpty;
  classDefinition.className = utf8name;
  classDefinition.attributes = kJSClassAttributeNone;
  classDefinition.finalize = JSCFinalize;
   

  int propertyCount = 0;
  int methodCount = 0;
  for (size_t i = 0; i < property_count; i++) {
    if (properties[i].method != 0) {
      methodCount++;
    } else {
      propertyCount++;
    }
  }

  std::vector<napi_property_descriptor> methodDescriptors;
  std::vector<napi_property_descriptor> propertyDescriptors;
  methodDescriptors.reserve(methodCount);
  propertyDescriptors.reserve(propertyCount);

  for (size_t i = 0; i < property_count; i++) {
    if (properties[i].method != 0) {
      methodDescriptors.push_back(properties[i]);
    } else {
      propertyDescriptors.push_back(properties[i]);
    }
  }

  FunctionTable table;
  
  JSStaticValue* staticValues = new JSStaticValue[propertyCount+1];
  for (auto i = 0;i<propertyCount;i++) {
    staticValues[i] = {propertyDescriptors[i].utf8name, JSCGetProperty, JSCSetProperty, kJSPropertyAttributeNone | kJSPropertyAttributeDontDelete};
    table.properties[std::string(propertyDescriptors[i].utf8name)] = {propertyDescriptors[i].getter, propertyDescriptors[i].setter, propertyDescriptors[i].data};
  }
  staticValues[propertyCount] = {0, 0, 0, 0};
  
  classDefinition.staticValues = staticValues;
  
  JSStaticFunction *staticFunctions = new JSStaticFunction[methodCount+1];
  assert(methodCount<70);
  
  table.env = env;
  table.table.resize(methodCount);
  for (auto i = 0;i<methodCount;i++) {
    JSObjectCallAsFunctionCallback method{ nullptr };
    if (i == 0) method = JSCStaticMethod<0>;
    else if (i == 1) method = JSCStaticMethod<1>;
    else if (i == 2) method = JSCStaticMethod<2>;
    else if (i == 3) method = JSCStaticMethod<3>;
    else if (i == 4) method = JSCStaticMethod<4>;
    else if (i == 5) method = JSCStaticMethod<5>;
    else if (i == 6) method = JSCStaticMethod<6>;
    else if (i == 7) method = JSCStaticMethod<7>;
    else if (i == 8) method = JSCStaticMethod<8>;
    else if (i == 9) method = JSCStaticMethod<9>;
    else if (i == 10) method = JSCStaticMethod<10>;
    else if (i == 11) method = JSCStaticMethod<11>;
    else if (i == 12) method = JSCStaticMethod<12>;
    else if (i == 13) method = JSCStaticMethod<13>;
    else if (i == 14) method = JSCStaticMethod<14>;
    else if (i == 15) method = JSCStaticMethod<15>;
    else if (i == 16) method = JSCStaticMethod<16>;
    else if (i == 17) method = JSCStaticMethod<17>;
    else if (i == 18) method = JSCStaticMethod<18>;
    else if (i == 19) method = JSCStaticMethod<19>;
    else if (i == 20) method = JSCStaticMethod<20>;
    else if (i == 21) method = JSCStaticMethod<21>;
    else if (i == 22) method = JSCStaticMethod<22>;
    else if (i == 23) method = JSCStaticMethod<23>;
    else if (i == 24) method = JSCStaticMethod<24>;
    else if (i == 25) method = JSCStaticMethod<25>;
    else if (i == 26) method = JSCStaticMethod<26>;
    else if (i == 27) method = JSCStaticMethod<27>;
    else if (i == 28) method = JSCStaticMethod<28>;
    else if (i == 29) method = JSCStaticMethod<29>;
    else if (i == 30) method = JSCStaticMethod<30>;
    else if (i == 31) method = JSCStaticMethod<31>;
    else if (i == 32) method = JSCStaticMethod<32>;
    else if (i == 33) method = JSCStaticMethod<33>;
    else if (i == 34) method = JSCStaticMethod<34>;
    else if (i == 35) method = JSCStaticMethod<35>;
    else if (i == 36) method = JSCStaticMethod<36>;
    else if (i == 37) method = JSCStaticMethod<37>;
    else if (i == 38) method = JSCStaticMethod<38>;
    else if (i == 39) method = JSCStaticMethod<39>;
    else if (i == 40) method = JSCStaticMethod<40>;
    else if (i == 41) method = JSCStaticMethod<41>;
    else if (i == 42) method = JSCStaticMethod<42>;
    else if (i == 43) method = JSCStaticMethod<43>;
    else if (i == 44) method = JSCStaticMethod<44>;
    else if (i == 45) method = JSCStaticMethod<45>;
    else if (i == 46) method = JSCStaticMethod<46>;
    else if (i == 47) method = JSCStaticMethod<47>;
    else if (i == 48) method = JSCStaticMethod<48>;
    else if (i == 49) method = JSCStaticMethod<49>;
    else if (i == 50) method = JSCStaticMethod<50>;
    else if (i == 51) method = JSCStaticMethod<51>;
    else if (i == 52) method = JSCStaticMethod<52>;
    else if (i == 53) method = JSCStaticMethod<53>;
    else if (i == 54) method = JSCStaticMethod<54>;
    else if (i == 55) method = JSCStaticMethod<55>;
    else if (i == 56) method = JSCStaticMethod<56>;
    else if (i == 57) method = JSCStaticMethod<57>;
    else if (i == 58) method = JSCStaticMethod<58>;
    else if (i == 59) method = JSCStaticMethod<59>;
    else if (i == 60) method = JSCStaticMethod<60>;
    else if (i == 61) method = JSCStaticMethod<61>;
    else if (i == 62) method = JSCStaticMethod<62>;
    else if (i == 63) method = JSCStaticMethod<63>;
    else if (i == 64) method = JSCStaticMethod<64>;
    else if (i == 65) method = JSCStaticMethod<65>;
    else if (i == 66) method = JSCStaticMethod<66>;
    else if (i == 67) method = JSCStaticMethod<67>;
    else if (i == 68) method = JSCStaticMethod<68>;
    else if (i == 69) method = JSCStaticMethod<69>;

    staticFunctions[i] = {methodDescriptors[i].utf8name, method, kJSPropertyAttributeReadOnly | kJSPropertyAttributeDontDelete};
    table.table[i] = {methodDescriptors[i].method, methodDescriptors[i].data};
  }
  staticFunctions[methodCount] = {0, 0, 0};

  classDefinition.staticFunctions = staticFunctions;


  JSClassRef classDef = JSClassCreate(&classDefinition);
  JSObjectRef ctor = JSObjectMakeConstructor(context, classDef, JSCCallAsConstructor);
  JSObjectSetProperty(context, globalObj, str, ctor, kJSPropertyAttributeNone, nullptr);
  
  ClassTable *cbInfo = new ClassTable{cb, data, classDef, env, table};
  constructorCB[ctor] = cbInfo;

  JSStringRelease(str);
  *result = reinterpret_cast<napi_value>(ctor);
  return napi_ok;
}

napi_status napi_get_array_length(napi_env env,
                  napi_value v,
                  uint32_t* result) {
  assert(JSValueIsArray(env->m_globalContext, reinterpret_cast<JSObjectRef>(v)));
  assert(JSObjectHasProperty(env->m_globalContext, reinterpret_cast<JSObjectRef>(v), JSStringCreateWithUTF8CString("length")));
  
  JSValueRef lengthValue = JSObjectGetProperty(env->m_globalContext, reinterpret_cast<JSObjectRef>(v), JSStringCreateWithUTF8CString("length"), nullptr);
  double length = JSValueToNumber(env->m_globalContext, lengthValue, nullptr);
  
  *result = uint32_t(length);
  return napi_ok;
}

napi_status napi_get_arraybuffer_info(napi_env env,
                    napi_value arraybuffer,
                    void** data,
                    size_t* byte_length) {
  auto context = env->m_globalContext;
  JSObjectRef array = reinterpret_cast<JSObjectRef>(arraybuffer);
  if (JSValueIsString(context, array)) {
    return napi_ok;
  }
    
  void* arrayData = JSObjectGetArrayBufferBytesPtr(context, array, nullptr);
  size_t elementCount = JSObjectGetArrayBufferByteLength(context, array, nullptr);
  if (data) {
    *data = arrayData;
  }
  if (byte_length) {
    *byte_length = elementCount;
  }
  return napi_ok;
}

napi_status napi_get_cb_info(
  napi_env env,         // [in] NAPI environment handle
  napi_callback_info cbinfo,  // [in] Opaque callback-info handle
  size_t* argc,    // [in-out] Specifies the size of the provided argv array
             // and receives the actual count of args.
  napi_value* argv,  // [out] Array of values
  napi_value* this_arg,  // [out] Receives the JS 'this' arg for the call
  void** data) {     // [out] Receives the data pointer for the callback.
  
  CallbackInfo * callbackInfo = reinterpret_cast<CallbackInfo*>(cbinfo);

  if (argv != nullptr) {
    //CHECK_ARG(argc);
    
    size_t i = 0;
    size_t min = std::min(*argc, static_cast<size_t>(callbackInfo->argc));
    
    for (; i < min; i++) {
      argv[i] = callbackInfo->argv[i];
    }
    
    if (i < *argc) {
      napi_value undefined;
      napi_get_undefined(env, &undefined);
      for (; i < *argc; i++) {
        argv[i] = undefined;
      }
    }
  }
  
  if (this_arg) {
    *this_arg = callbackInfo->thisArg;
  }
  
  if (argc) {
    *argc = callbackInfo->argc;
  }
  
  if (data) {
    *data = callbackInfo->data;
  }
  
  return napi_ok;
}


napi_status napi_set_element(napi_env env,
               napi_value object,
               uint32_t i,
               napi_value v) {
  JSObjectSetPropertyAtIndex(env->m_globalContext, reinterpret_cast<JSObjectRef>(object), i, reinterpret_cast<JSValueRef>(v), nullptr);
  return napi_ok;
}

napi_status napi_get_element(napi_env env,
               napi_value object,
               uint32_t i,
               napi_value* result) {
  
  OpaqueJSValue* jsValue = const_cast<OpaqueJSValue*>(JSObjectGetPropertyAtIndex(env->m_globalContext, reinterpret_cast<JSObjectRef>(object), i, nullptr));
  *result = reinterpret_cast<napi_value>(jsValue);
  return napi_ok;
}

JSGlobalContextRef gcontextref;
napi_status napi_get_global(napi_env env, napi_value* result) {
  gcontextref = JSContextGetGlobalContext(env->m_globalContext);
  JSObjectRef contextObject = JSContextGetGlobalObject(env->m_globalContext);
  *result = reinterpret_cast<napi_value>(contextObject);
  return napi_ok;
}

napi_status napi_get_new_target(napi_env env,
                napi_callback_info cbinfo,
                napi_value* result) {
  const CallbackInfo* info = reinterpret_cast<CallbackInfo*>(cbinfo);
  if (info->isConstructCall) {
    *result = info->newTarget;
  } else {
    *result = nullptr;
  }
  return napi_ok;
}

napi_status napi_get_null(napi_env env, napi_value* result) {

  OpaqueJSValue* jsValue = const_cast<OpaqueJSValue*>(JSValueMakeNull(env->m_globalContext));
  *result = reinterpret_cast<napi_value>(jsValue);
  return napi_ok;
}

napi_status napi_get_typedarray_info(napi_env env,
                   napi_value typedarray,
                   napi_typedarray_type* type,
                   size_t* length,
                   void** data,
                   napi_value* arraybuffer,
                   size_t* byte_offset) {
  JSValueRef exception;
  auto context = env->m_globalContext;
  JSObjectRef array = reinterpret_cast<JSObjectRef>(typedarray);
  JSObjectRef typedObject = JSObjectGetTypedArrayBuffer(context, array, nullptr);
  void* arrayData = JSObjectGetArrayBufferBytesPtr(context, typedObject, &exception); // temporary
  if (!arrayData) {
    DumpException(env, exception);
  }
  
  size_t arrayByteOffset = JSObjectGetTypedArrayByteOffset(context, array, nullptr);
  size_t elementCount = JSObjectGetTypedArrayLength(context, array, nullptr);
  JSTypedArrayType jsType = JSValueGetTypedArrayType(context, array, nullptr);
  if (type != nullptr) {
    switch (jsType) {
      case kJSTypedArrayTypeInt8Array:
        *type = napi_int8_array;
        break;
      case kJSTypedArrayTypeUint8Array:
        *type = napi_uint8_array;
        break;
      case kJSTypedArrayTypeUint8ClampedArray:
        *type = napi_uint8_clamped_array;
        break;
      case kJSTypedArrayTypeInt16Array:
        *type = napi_int16_array;
        break;
      case kJSTypedArrayTypeUint16Array:
        *type = napi_uint16_array;
        break;
      case kJSTypedArrayTypeInt32Array:
        *type = napi_int32_array;
        break;
      case kJSTypedArrayTypeUint32Array:
        *type = napi_uint32_array;
        break;
      case kJSTypedArrayTypeFloat32Array:
        *type = napi_float32_array;
        break;
      case kJSTypedArrayTypeFloat64Array:
        *type = napi_float64_array;
        break;
      default:
        assert(0);
    }
  }

  if (length != nullptr) {
    *length = elementCount;
  }
  
  if (data != nullptr) {
    *data = static_cast<uint8_t*>(arrayData) + arrayByteOffset;
  }
  
  if (arraybuffer != nullptr) {
    *arraybuffer = reinterpret_cast<napi_value>(typedObject);
  }
  
  if (byte_offset != nullptr) {
    *byte_offset = arrayByteOffset;
  }
  
  return napi_ok;
}

napi_status napi_run_script(napi_env env,
              napi_value script,
              const char* sourceUrl,
              napi_value* result) {
  JSStringRef statement = reinterpret_cast<JSStringRef>(script);
  JSValueRef exception;
  OpaqueJSValue *retValue = const_cast<OpaqueJSValue*>(JSEvaluateScript(env->m_globalContext, statement, nullptr, JSStringCreateWithUTF8CString(sourceUrl), 1, &exception));
  if (!retValue) {
    DumpException(env, exception);
  }
  *result = reinterpret_cast<napi_value>(retValue);
  return napi_ok;
}

napi_status napi_typeof(napi_env env, napi_value vv, napi_valuetype* result) {

  JSType valueType = JSValueGetType(env->m_globalContext, reinterpret_cast<JSValueRef>(vv));
  switch (valueType) {
    case kJSTypeUndefined: *result = napi_undefined; break;
    case kJSTypeNull: *result = napi_null; break;
    case kJSTypeNumber: *result = napi_number; break;
    case kJSTypeString: *result = napi_string; break;
    case kJSTypeBoolean: *result = napi_boolean; break;
    case kJSTypeObject: *result = napi_object; break;
    default:
      assert(0);
  }
  return napi_ok;
}

napi_status napi_coerce_to_object(napi_env env,
                                  napi_value v,
                                  napi_value* result) {
  JSValueRef value = reinterpret_cast<JSValueRef>(v);
  JSObjectRef object = JSValueToObject(env->m_globalContext, value, nullptr);
  if (result) {
    *result = reinterpret_cast<napi_value>(object);
  }
  return napi_ok;
}

napi_status napi_wrap(napi_env env,
            napi_value js_object,
            void* native_object,
            napi_finalize finalize_cb,
            void* finalize_hint,
            napi_ref* result) {
  JSObjectRef object = reinterpret_cast<JSObjectRef>(js_object);
  JSObjectSetPrivate(object, native_object);
  assert(JSObjectGetPrivate(object) == native_object);
  if (result) {
    *result = reinterpret_cast<napi_ref>(object);
  }
  return napi_ok;
}

napi_status napi_unwrap(napi_env env, napi_value js_object, void** result) {
  JSObjectRef object = reinterpret_cast<JSObjectRef>(js_object);
  *result = JSObjectGetPrivate(object);
  return napi_ok;
}

napi_status napi_throw_type_error(napi_env env,
                  const char* code,
                  const char* msg) {
  assert(0);
  return napi_ok;
}

napi_status napi_throw(napi_env env, napi_value error) {
  assert(0);
  return napi_ok;
}

napi_status napi_strict_equals(napi_env env,
                 napi_value lhs,
                 napi_value rhs,
                 bool* result) {
  auto context = env->m_globalContext;
  JSValueRef left = reinterpret_cast<JSValueRef>(lhs);
  JSValueRef right = reinterpret_cast<JSValueRef>(rhs);
  *result = JSValueIsEqual(context, left, right, nullptr);
  return napi_ok;
}

napi_status napi_set_named_property(napi_env env,
                  napi_value object,
                  const char* utf8name,
                  napi_value value) {
  auto context = env->m_globalContext;
  JSObjectRef jsObject = reinterpret_cast<JSObjectRef>(object);
  JSStringRef propertyName = JSStringCreateWithUTF8CString(utf8name);
  JSValueRef jsValue = reinterpret_cast<JSValueRef>(value);
  JSObjectSetProperty(context, jsObject, propertyName, jsValue, kJSPropertyAttributeNone, nullptr);
  JSStringRelease(propertyName);
  return napi_ok;
}

napi_status napi_new_instance(napi_env env,
                napi_value constructor,
                size_t argc,
                const napi_value* argv,
                napi_value* result) {
  JSObjectRef ctor = reinterpret_cast<JSObjectRef>(constructor);

  auto iter = constructorCB.find(ctor);
  assert(iter != constructorCB.end());

  assert(JSObjectIsConstructor(env->m_globalContext, ctor));
  OpaqueJSValue* jsValue = const_cast<OpaqueJSValue*>(JSObjectCallAsConstructor(env->m_globalContext, ctor, argc, reinterpret_cast<const JSValueRef*>(argv), nullptr));
  napi_value value = reinterpret_cast<napi_value>(jsValue);
  FunctionTables[jsValue] = &iter->second->FunctionTable;
  *result = value;
  return napi_ok;
}

JSValueRef JSObjectCallAsFunctionCallbackDefault(JSContextRef ctx, JSObjectRef function, JSObjectRef thisObject, size_t argumentCount, const JSValueRef arguments[], JSValueRef* exception) {
    return RaiseException(ctx, exception, "JavaScriptCore : callback function is not implemented.");
}

  napi_status napi_define_properties(napi_env env,
                   const napi_value object,
                   size_t property_count,
                   const napi_property_descriptor* properties) {
  return napi_ok;
}

napi_status napi_create_external(napi_env env,
                 void* data,
                 napi_finalize finalize_cb,
                 void* finalize_hint,
                 napi_value* result) {
  static JSClassRef classDef = nullptr;
  if (!classDef) {
      JSClassDefinition classDefinition = kJSClassDefinitionEmpty;
      classDefinition.className = "dummyClass";
      classDef = JSClassCreate(&classDefinition);
  }
    
  JSObjectRef jsObject = JSObjectMake(env->m_globalContext, classDef, data);
  assert(JSObjectGetPrivate(jsObject) == data);
  *result = reinterpret_cast<napi_value>(jsObject);
  return napi_ok;
}

napi_status napi_get_value_external(napi_env env, napi_value v, void** result) {
  return napi_unwrap(env, v, result);
}

void TypedArrayBytesDeallocator(void* bytes, void* deallocatorContext)
{
  free(bytes);
}

napi_status napi_create_arraybuffer(napi_env env,
                  size_t byte_length,
                  void** data,
                  napi_value* result) {
  uint8_t *bytes = (uint8_t*)malloc(byte_length);
  JSObjectRef jsObject = JSObjectMakeArrayBufferWithBytesNoCopy(env->m_globalContext, bytes, byte_length, TypedArrayBytesDeallocator, nullptr, nullptr);
  *result = reinterpret_cast<napi_value>(jsObject);
  return napi_ok;
}
