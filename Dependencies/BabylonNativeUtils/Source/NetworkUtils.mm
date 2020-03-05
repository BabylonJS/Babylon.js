#include "NetworkUtils.h"
#import <Foundation/Foundation.h>

namespace Babylon
{
    std::string GetAbsoluteUrl(const std::string& url, const std::string& rootUrl)
    {
        NSString *urlStr = [NSString stringWithCString:url.c_str() encoding:[NSString defaultCStringEncoding]];
        NSString *rootUrlStr = [NSString stringWithCString:rootUrl.c_str() encoding:[NSString defaultCStringEncoding]];
        NSString *completeURL = [NSString stringWithFormat:@"%@/%@",rootUrlStr,urlStr];
        NSURL *baseUrl = [NSURL URLWithString:completeURL];
        NSError *error;
        BOOL reachable = [baseUrl checkResourceIsReachableAndReturnError:&error];
        if (reachable)
        {
            return std::string([completeURL UTF8String]);
        }
        return url;
    }

    template<typename DataT>
    arcana::task<DataT, std::exception_ptr> LoadUrlAsync(std::string url)
    {
        __block arcana::task_completion_source<DataT, std::exception_ptr> taskCompletionSource{};
        NSString *urlStr = [NSString stringWithCString:url.c_str() encoding:[NSString defaultCStringEncoding]];
        NSURLRequest *request = [NSURLRequest requestWithURL:[NSURL URLWithString:urlStr]];
        NSURLSession *session = [NSURLSession sharedSession];
        NSURLSessionDataTask *task = [session dataTaskWithRequest:request completionHandler:^(NSData * _Nullable data, NSURLResponse * _Nullable response, NSError * _Nullable error) {
            if (!error) {
                DataT dataT{};
                dataT.resize(data.length);
                [data getBytes:dataT.data()
                        length:data.length];
                taskCompletionSource.complete(std::move(dataT));
            }
            else
            {
                NSLog(@"Error: %@", [error localizedDescription]);
            }
        }];
        [task resume];
        return taskCompletionSource.as_task();
    }

    arcana::task<std::string, std::exception_ptr> LoadTextAsync(std::string url)
    {
        return LoadUrlAsync<std::string>(std::move(url));
    }

    arcana::task<std::vector<uint8_t>, std::exception_ptr> LoadBinaryAsync(std::string url)
    {
        return LoadUrlAsync<std::vector<uint8_t>>(std::move(url));
    }
}
