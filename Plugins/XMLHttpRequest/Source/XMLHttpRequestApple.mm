// XMLHttpRequest from https://github.com/Lukas-Stuehrk/XMLHTTPRequest
// with modifications (addEventListener, arraybuffer)
// MIT License

#import "Babylon/XMLHttpRequestApple.h"

void bytesDeallocator(void* ptr, void* context)
{
    free(ptr);
}

void InitializeXMLHttpRequest(Napi::Env env)
{
    auto& runtime = Babylon::JsRuntime::GetFromJavaScript(env);
    JSGlobalContextRef globalContext = Napi::GetContext<JSGlobalContextRef>(env);
    [[XMLHttpRequest new] extend:globalContext:&runtime];
}

@implementation XMLHttpRequest {
};

@synthesize response;
@synthesize responseText;
@synthesize responseType;
@synthesize readyState;
@synthesize onload;
@synthesize onerror;
@synthesize status;
@synthesize statusText;
@synthesize _eventHandlers;
@synthesize _urlSession;
@synthesize _httpMethod;
@synthesize _url;
@synthesize _async;
@synthesize _requestHeaders;
@synthesize _responseHeaders;
@synthesize _onreadystatechange;

static JSGlobalContextRef _jsGlobalContextRef = nil;
static JSContext *_jsContext = nil;
static Babylon::JsRuntime* _runtime = nil;

- (instancetype)init {
    return [self initWithURLSession:[NSURLSession sharedSession]];
}

- (instancetype)initWithURLSession:(NSURLSession *)urlSession {
    if (self = [super init]) {
        self._urlSession = urlSession;
        self.readyState = @(XMLHttpRequestUNSENT);
        self._requestHeaders = [NSMutableDictionary new];
        self._eventHandlers = [NSMutableDictionary new];
    }
    return self;
}

- (void)extend:(JSGlobalContextRef)globalContextRef:(Babylon::JsRuntime*)runtime {
    _jsGlobalContextRef = globalContextRef;
    _runtime = runtime;

    JSContext *jsContext = _jsContext = [JSContext contextWithJSGlobalContextRef:globalContextRef];
    jsContext[@"XMLHttpRequest"] = ^{
        return [[XMLHttpRequest alloc] init];
    };
    jsContext[@"XMLHttpRequest"][@"UNSENT"] = @(XMLHttpRequestUNSENT);
    jsContext[@"XMLHttpRequest"][@"OPENED"] = @(XMLHttpRequestOPENED);
    jsContext[@"XMLHttpRequest"][@"LOADING"] = @(XMLHttpRequestLOADING);
    jsContext[@"XMLHttpRequest"][@"HEADERS"] = @(XMLHttpRequestHEADERS);
    jsContext[@"XMLHttpRequest"][@"DONE"] = @(XMLHttpRequestDONE);
}

- (void)open:(NSString *)httpMethod :(NSString *)url :(bool)async {
    // TODO should throw an error if called with wrong arguments
    self._httpMethod = httpMethod;
    self._url = [NSURL URLWithString:url];
    self._async = async;
    self.readyState = @(XMLHttpRequestOPENED);
}

- (void)addEventListener:(NSString *)event :(JSValue *)callback {
    self._eventHandlers[event] = callback;
}

- (void)removeEventListener:(NSString *)event :(JSValue *)callback {
    self._eventHandlers[event] = nil;
}

- (void)send:(id)data {
    NSMutableURLRequest *request = [NSMutableURLRequest requestWithURL:self._url];
    for (NSString *name in _requestHeaders) {
        [request setValue:_requestHeaders[name] forHTTPHeaderField:name];
    }
    if ([data isKindOfClass:[NSString class]]) {
        request.HTTPBody = [((NSString *) data) dataUsingEncoding:NSUTF8StringEncoding];
    }
    [request setHTTPMethod:_httpMethod];

    __block __weak XMLHttpRequest *weakSelf = self;

    id completionHandler = ^(NSData *receivedData, NSURLResponse *response, NSError *error) {
        NSHTTPURLResponse *httpResponse = (NSHTTPURLResponse *)response;
        weakSelf.readyState = @(XMLHttpRequestDONE);
        weakSelf.status = @(httpResponse.statusCode);
        weakSelf.statusText = [NSString stringWithFormat:@"%ld",httpResponse.statusCode];
        if (!weakSelf.responseType || [weakSelf.responseType isEqualToString:@"text"])
        {
            weakSelf.responseText = [[NSString alloc] initWithData:receivedData
                                                      encoding:NSUTF8StringEncoding];
        }
        else if ([weakSelf.responseType isEqualToString:@"arraybuffer"])
        {
            size_t byteLength = receivedData.length;
            unsigned char* bytes = (unsigned char*)malloc(byteLength);
            weakSelf.response = [JSValue valueWithJSValueRef:JSObjectMakeArrayBufferWithBytesNoCopy(_jsGlobalContextRef,
                                                                                bytes,
                                                                                byteLength,
                                                                                bytesDeallocator, 0, 0) inContext:_jsContext];
            memcpy(bytes, receivedData.bytes, byteLength);
        }
        
        weakSelf._onreadystatechange = weakSelf._eventHandlers[@"readystatechange"];
        [weakSelf setAllResponseHeaders:[httpResponse allHeaderFields]];
        if (weakSelf._onreadystatechange != nil) {
            _runtime->Dispatch([self](Napi::Env) {
                [self._onreadystatechange callWithArguments:@[]];
            });
        }
    };
    NSURLSessionDataTask *task = [_urlSession dataTaskWithRequest:request
                                                completionHandler:completionHandler];
    [task resume];
}

- (void)setRequestHeader:(NSString *)name :(NSString *)value {
    _requestHeaders[name] = value;
}

- (NSString *)getAllResponseHeaders {
    NSMutableString *responseHeaders = [NSMutableString new];
    for (NSString *key in _responseHeaders) {
        [responseHeaders appendString:key];
        [responseHeaders appendString:@": "];
        [responseHeaders appendString:_responseHeaders[key]];
        [responseHeaders appendString:@"\r\n"];
    }
    return responseHeaders;
}

- (NSString *)getResponseHeader:(NSString *)name {
    return _responseHeaders[name];
}

- (void)setAllResponseHeaders:(NSDictionary *)responseHeaders {
    _responseHeaders = responseHeaders;
}

@end
