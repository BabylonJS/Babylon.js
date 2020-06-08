Pod::Spec.new do |s|

    s.name         = "BabylonNative"
    s.version      = "0.0.2"
    s.summary      = "Babylon Native "
  
    s.homepage     = "https://github.com/CedricGuillemet/BabylonNative"
  
    s.license      = "MIT"
  
    s.author             = { "ceguille" => "ceguille@microsoft.com" }
  
    s.ios.deployment_target = "12.0"
    s.source       = { :git => "https://github.com/CedricGuillemet/BabylonNative.git", :branch => "master", :tag => s.version.to_s }
  
    s.source_files  = "Apps/Playground/iOS/*.{h,m,mm}"
  
    s.requires_arc = true
  
  end