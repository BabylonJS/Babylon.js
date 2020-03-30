// XMLHttpRequest from https://github.com/Lukas-Stuehrk/XMLHTTPRequest
// with modifications (addEventListener, arraybuffer)
// MIT License
#import <Foundation/Foundation.h>
#import <JavaScriptCore/JavaScriptCore.h>
#include <napi/napi.h>
#include <Babylon/JsRuntime.h>

typedef void (^ CompletionHandlerFunction)();
typedef void (^ CompletionHandler)(CompletionHandlerFunction);

void InitializeXMLHttpRequest(Napi::Env);

typedef NS_ENUM(NSUInteger , ReadyState) {
    XMLHttpRequestUNSENT =0,	// open()has not been called yet.
    XMLHttpRequestOPENED,	    // send()has not been called yet.
    XMLHttpRequestHEADERS,      // RECEIVED	send() has been called, and headers and status are available.
    XMLHttpRequestLOADING,      // Downloading; responseText holds partial data.
    XMLHttpRequestDONE          // The operation is complete.
};

@protocol XMLHttpRequest <JSExport>
@property (nonatomic, retain) JSValue *response;
@property (nonatomic) NSString *responseText;
@property (nonatomic, copy) NSString *responseType;

@property (nonatomic) NSNumber *readyState;
@property (nonatomic) JSValue *onload;
@property (nonatomic) JSValue *onerror;
@property (nonatomic) NSNumber *status;
@property (nonatomic) NSString *statusText;

-(void)open:(NSString *)httpMethod :(NSString *)url :(bool)async;
-(void)send:(id)data;
-(void)setRequestHeader:(NSString *)name :(NSString *)value;
-(void)addEventListener:(NSString *)event :(JSValue *)callback;
-(void)removeEventListener:(NSString *)event :(JSValue *)callback;
-(NSString *)getAllResponseHeaders;
-(NSString *)getResponseHeader:(NSString *)name;
@end

@interface XMLHttpRequest : NSObject <XMLHttpRequest>
- (instancetype)initWithURLSession: (NSURLSession *)urlSession;
- (void)extend:(JSGlobalContextRef)globalContextRef:(Babylon::JsRuntime *)runtime;
@property (nonatomic) NSMutableDictionary *_eventHandlers;
@property (atomic, copy) NSURLSession *_urlSession;
@property (atomic, copy) NSString *_httpMethod;
@property (atomic, copy) NSURL *_url;
@property (atomic) bool _async;
@property (nonatomic) NSMutableDictionary *_requestHeaders;
@property (atomic, copy) NSDictionary *_responseHeaders;
//@property (atomic, copy) NSString *_urlString;
@property (nonatomic, retain) JSValue *_onreadystatechange;
@end
