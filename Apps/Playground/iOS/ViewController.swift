import UIKit
import MetalKit

class ViewController: UIViewController {
    
    var mtkView: MTKView!
    
    override func viewDidLoad() {
        super.viewDidLoad()
    }
    
    override func viewDidAppear(_ animated: Bool) {
        super.viewDidAppear(animated)
        let appDelegate = UIApplication.shared.delegate as? AppDelegate
        if appDelegate != nil {
            mtkView = MTKView()
            mtkView.translatesAutoresizingMaskIntoConstraints = false
            view.addSubview(mtkView)
            view.addConstraints(NSLayoutConstraint.constraints(withVisualFormat: "|[mtkView]|", options: [], metrics: nil, views: ["mtkView" : mtkView]))
            view.addConstraints(NSLayoutConstraint.constraints(withVisualFormat: "V:|[mtkView]|", options: [], metrics: nil, views: ["mtkView" : mtkView]))
            
            let device = MTLCreateSystemDefaultDevice()!
            mtkView.device = device
            
            mtkView.colorPixelFormat = .bgra8Unorm_srgb
            mtkView.depthStencilPixelFormat = .depth32Float
            
            let gesture = UIPanGestureRecognizer(target: self, action:  #selector(self.panGesture))
            mtkView.addGestureRecognizer(gesture)

            let rawMetalLayerPtr: UnsafeMutableRawPointer = Unmanaged.passUnretained(mtkView.layer).toOpaque()
            
            let scale = UIScreen.main.scale
            let width = view.bounds.size.width
            let height = view.bounds.size.height
            
            appDelegate!._bridge!.init(rawMetalLayerPtr, width:Int32(width * scale), height:Int32(height * scale))
        }
    }

    override func viewWillLayoutSubviews() {
        super.viewWillLayoutSubviews()
        let appDelegate = UIApplication.shared.delegate as? AppDelegate
        if mtkView == nil {
            return
        }
        if appDelegate != nil {
            let scale = UIScreen.main.scale
            let width = view.bounds.size.width
            let height = view.bounds.size.height

            appDelegate!._bridge!.resize(Int32(width * scale), height: Int32(height * scale))
        }
    }

    @objc func panGesture(sender : UIPanGestureRecognizer) {
        let appDelegate = UIApplication.shared.delegate as? AppDelegate
        if appDelegate != nil {
            let translation = sender.translation(in:mtkView)
            appDelegate!._bridge!.setInputs(Int32(translation.x), y:Int32(translation.y), tap:true)
        }
    }
}

