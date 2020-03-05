// XMLHttpRequest from https://github.com/Lukas-Stuehrk/XMLHTTPRequest
// with modifications (addEventListener, arraybuffer)
// MIT License

#import "Babylon/XMLHttpRequestApple.h"

void bytesDeallocator(void* ptr, void* context)
{
    free(ptr);
}

@implementation XMLHttpRequest {
    NSURLSession *_urlSession;
    NSString *_httpMethod;
    NSURL *_url;
    bool _async;
    NSMutableDictionary *_requestHeaders;
    NSDictionary *_responseHeaders;
};

@synthesize response;
@synthesize responseText;
@synthesize responseType;
@synthesize onreadystatechange;
@synthesize readyState;
@synthesize onload;
@synthesize onerror;
@synthesize status;
@synthesize statusText;
@synthesize _eventHandlers;

static JSGlobalContextRef _jsGlobalContextRef = nil;
static JSContext *_jsContext = nil;
static CompletionHandler _completionHandler;

- (instancetype)init {
    return [self initWithURLSession:[NSURLSession sharedSession]];
}

- (instancetype)initWithURLSession:(NSURLSession *)urlSession {
    if (self = [super init]) {
        _urlSession = urlSession;
        self.readyState = @(XMLHttpRequestUNSENT);
        _requestHeaders = [NSMutableDictionary new];
        _eventHandlers = [NSMutableDictionary new];
    }
    return self;
}

- (void)extend:(JSGlobalContextRef)globalContextRef :(CompletionHandler)completionHandler {
    _jsGlobalContextRef = globalContextRef;
    _completionHandler = completionHandler;
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
    _httpMethod = httpMethod;
    _url = [NSURL URLWithString:url];
    _async = async;
    self.readyState = @(XMLHttpRequestOPENED);
}

- (void)addEventListener:(NSString *)event :(JSValue *)callback {
    self._eventHandlers[event] = callback;
}

- (void)removeEventListener:(NSString *)event :(JSValue *)callback {
    self._eventHandlers[event] = nil;
}

- (void)send:(id)data {
    NSMutableURLRequest *request = [NSMutableURLRequest requestWithURL:_url];
    for (NSString *name in _requestHeaders) {
        [request setValue:_requestHeaders[name] forHTTPHeaderField:name];
    }
    if ([data isKindOfClass:[NSString class]]) {
        request.HTTPBody = [((NSString *) data) dataUsingEncoding:NSUTF8StringEncoding];
    }
    [request setHTTPMethod:_httpMethod];

    __block __weak XMLHttpRequest *weakSelf = self;

    id completionHandler = ^(NSData *receivedData, NSURLResponse *response, NSError *error) {
        NSHTTPURLResponse *httpResponse = (NSHTTPURLResponse *) response;
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
        
        weakSelf.onreadystatechange = weakSelf._eventHandlers[@"readystatechange"];
        [weakSelf setAllResponseHeaders:[httpResponse allHeaderFields]];
        if (weakSelf.onreadystatechange != nil) {
            void (^completion)() = ^() {
                [weakSelf.onreadystatechange callWithArguments:@[]];
            };
            _completionHandler(completion);
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
