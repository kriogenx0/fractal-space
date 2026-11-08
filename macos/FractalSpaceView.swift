// MIT License — Copyright (c) 2026 Alex Vaos. See LICENSE.
// macOS screensaver that plays dist/screensaver/ in a WKWebView.
// The site is bundled under Contents/Resources/site and served through a
// custom URL scheme, so it works offline and ES modules / iframes stay same-origin.
import ScreenSaver
import WebKit

private let scheme = "fractalspace"

final class SiteSchemeHandler: NSObject, WKURLSchemeHandler {
    private let root: URL

    init(root: URL) { self.root = root.standardizedFileURL }

    func webView(_ webView: WKWebView, start task: WKURLSchemeTask) {
        guard let url = task.request.url else { return task.didFailWithError(URLError(.badURL)) }
        var path = url.path
        if path.isEmpty || path.hasSuffix("/") { path += "index.html" }
        let file = root.appendingPathComponent(String(path.drop(while: { $0 == "/" }))).standardizedFileURL
        let inside = file.path.hasPrefix(root.path + "/")
        guard inside, let data = try? Data(contentsOf: file) else {
            let response = HTTPURLResponse(url: url, statusCode: 404, httpVersion: "HTTP/1.1", headerFields: ["Content-Type": "text/plain"])!
            task.didReceive(response)
            task.didReceive(Data())
            task.didFinish()
            return
        }
        let headers = ["Content-Type": Self.mimeType(file.pathExtension), "Content-Length": String(data.count), "Cache-Control": "no-cache"]
        task.didReceive(HTTPURLResponse(url: url, statusCode: 200, httpVersion: "HTTP/1.1", headerFields: headers)!)
        task.didReceive(data)
        task.didFinish()
    }

    func webView(_ webView: WKWebView, stop task: WKURLSchemeTask) {}

    private static func mimeType(_ ext: String) -> String {
        switch ext.lowercased() {
        case "html": return "text/html; charset=utf-8"
        case "js", "mjs": return "text/javascript; charset=utf-8"
        case "css": return "text/css; charset=utf-8"
        case "json": return "application/json"
        case "svg": return "image/svg+xml"
        case "png": return "image/png"
        case "jpg", "jpeg": return "image/jpeg"
        case "txt": return "text/plain; charset=utf-8"
        case "woff2": return "font/woff2"
        default: return "application/octet-stream"
        }
    }
}

@objc(FractalSpaceView)
final class FractalSpaceView: ScreenSaverView {
    private var webView: WKWebView?
    private var schemeHandler: SiteSchemeHandler?
    private var stopped = false

    override init?(frame: NSRect, isPreview: Bool) {
        super.init(frame: frame, isPreview: isPreview)
        setUp()
    }

    required init?(coder: NSCoder) {
        super.init(coder: coder)
        setUp()
    }

    private var startURL: URL {
        let bundle = Bundle(for: FractalSpaceView.self)
        // Optional override, e.g. the live site:
        //   defaults -currentHost write org.fractalspace.screensaver URL "https://fractalspace.org/screensaver/"
        if let defaults = ScreenSaverDefaults(forModuleWithName: bundle.bundleIdentifier ?? "org.fractalspace.screensaver"),
           let custom = defaults.string(forKey: "URL"), let url = URL(string: custom) {
            return url
        }
        return URL(string: "\(scheme)://app/screensaver/" + (isPreview ? "?caption=off" : ""))!
    }

    private func setUp() {
        wantsLayer = true
        layer?.backgroundColor = NSColor.black.cgColor
        animationTimeInterval = 1

        let configuration = WKWebViewConfiguration()
        if let site = Bundle(for: FractalSpaceView.self).resourceURL?.appendingPathComponent("site") {
            let handler = SiteSchemeHandler(root: site)
            schemeHandler = handler
            configuration.setURLSchemeHandler(handler, forURLScheme: scheme)
        }
        configuration.mediaTypesRequiringUserActionForPlayback = []
        let web = WKWebView(frame: bounds, configuration: configuration)
        web.autoresizingMask = [.width, .height]
        addSubview(web)
        webView = web
        web.load(URLRequest(url: startURL))

        // Since macOS 14 the legacy screensaver host can keep views alive after the
        // screensaver is dismissed; unload the page so it stops using the GPU.
        DistributedNotificationCenter.default().addObserver(
            self, selector: #selector(screensaverWillStop),
            name: NSNotification.Name("com.apple.screensaver.willstop"), object: nil)
    }

    @objc private func screensaverWillStop() {
        stopped = true
        webView?.load(URLRequest(url: URL(string: "about:blank")!))
    }

    override func startAnimation() {
        super.startAnimation()
        if stopped {
            stopped = false
            webView?.load(URLRequest(url: startURL))
        }
    }

    override func stopAnimation() {
        super.stopAnimation()
    }

    override func animateOneFrame() {}

    override var hasConfigureSheet: Bool { false }
    override var configureSheet: NSWindow? { nil }

    deinit { DistributedNotificationCenter.default().removeObserver(self) }
}
