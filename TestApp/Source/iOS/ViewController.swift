import UIKit

class ViewController: UIViewController {

    override func viewDidLoad() {
        super.viewDidLoad()
        let appDelegate = UIApplication.shared.delegate as? AppDelegate
        if appDelegate != nil
        {
            let screenBounds = UIScreen.main.bounds
            let width = screenBounds.size.width
            let height = screenBounds.size.height
            //let scale = UIScreen.main.scale
            
            // Swift doesn't understand void* pointers, rather it encapsulates them in a specialized pointer class
            let rawMetalLayerPtr: UnsafeMutableRawPointer = Unmanaged.passUnretained(self.view.layer).toOpaque()
            
            appDelegate!._bridge!.init(rawMetalLayerPtr, width: Int32(width), height: Int32(height))
        }
    }
}

