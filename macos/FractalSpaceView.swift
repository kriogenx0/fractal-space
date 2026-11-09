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
        guard let file = resolve(url), let data = try? Data(contentsOf: file) else {
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

    /// Maps fractalspace://app/a/b to Resources/site/a/b, and directories to their index.html.
    /// URL.path drops a trailing slash, so directories are detected on disk, not from the URL.
    func resolve(_ url: URL) -> URL? {
        let path = URLComponents(url: url, resolvingAgainstBaseURL: false)?.path ?? url.path
        var file = root.appendingPathComponent(String(path.drop(while: { $0 == "/" }))).standardizedFileURL
        guard file.path == root.path || file.path.hasPrefix(root.path + "/") else { return nil }
        var isDirectory: ObjCBool = false
        if FileManager.default.fileExists(atPath: file.path, isDirectory: &isDirectory), isDirectory.boolValue {
            file = file.appendingPathComponent("index.html")
        }
        return FileManager.default.isReadableFile(atPath: file.path) ? file : nil
    }

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
final class FractalSpaceView: ScreenSaverView, WKNavigationDelegate {
    private var webView: WKWebView?
    private var schemeHandler: SiteSchemeHandler?
    private let spinner = NSProgressIndicator()
    private let status = NSTextField(labelWithString: "Loading Fractal Space…")
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
        web.navigationDelegate = self
        // Never flash white: no page background until the page paints its own black.
        web.setValue(false, forKey: "drawsBackground")
        if #available(macOS 12.0, *) { web.underPageBackgroundColor = .black }
        web.isHidden = true
        addSubview(web)
        webView = web

        // Native loader, shown until the page has loaded (the page then shows its own).
        spinner.style = .spinning
        spinner.controlSize = isPreview ? .small : .regular
        spinner.appearance = NSAppearance(named: .darkAqua)
        spinner.translatesAutoresizingMaskIntoConstraints = false
        status.font = .monospacedSystemFont(ofSize: isPreview ? 9 : 12, weight: .medium)
        status.textColor = NSColor(white: 1, alpha: 0.7)
        status.alignment = .center
        status.translatesAutoresizingMaskIntoConstraints = false
        addSubview(spinner)
        addSubview(status)
        NSLayoutConstraint.activate([
            spinner.centerXAnchor.constraint(equalTo: centerXAnchor),
            spinner.centerYAnchor.constraint(equalTo: centerYAnchor, constant: -12),
            status.centerXAnchor.constraint(equalTo: centerXAnchor),
            status.topAnchor.constraint(equalTo: spinner.bottomAnchor, constant: 14),
            status.widthAnchor.constraint(lessThanOrEqualTo: widthAnchor, constant: -32),
        ])
        load()

        // Since macOS 14 the legacy screensaver host can keep views alive after the
        // screensaver is dismissed; unload the page so it stops using the GPU.
        DistributedNotificationCenter.default().addObserver(
            self, selector: #selector(screensaverWillStop),
            name: NSNotification.Name("com.apple.screensaver.willstop"), object: nil)
    }

    private func load() {
        showLoader("Loading Fractal Space…")
        webView?.load(URLRequest(url: startURL))
    }

    private func showLoader(_ text: String, spinning: Bool = true) {
        status.stringValue = text
        status.isHidden = false
        spinner.isHidden = !spinning
        if spinning { spinner.startAnimation(nil) } else { spinner.stopAnimation(nil) }
    }

    func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
        guard !stopped else { return }
        webView.isHidden = false
        spinner.stopAnimation(nil)
        spinner.isHidden = true
        status.isHidden = true
    }

    func webView(_ webView: WKWebView, didFail navigation: WKNavigation!, withError error: Error) {
        showLoader("Fractal Space could not load: \(error.localizedDescription)", spinning: false)
    }

    func webView(_ webView: WKWebView, didFailProvisionalNavigation navigation: WKNavigation!, withError error: Error) {
        showLoader("Fractal Space could not load: \(error.localizedDescription)", spinning: false)
    }

    func webViewWebContentProcessDidTerminate(_ webView: WKWebView) {
        if !stopped { load() }
    }

    @objc private func screensaverWillStop() {
        stopped = true
        webView?.isHidden = true
        webView?.load(URLRequest(url: URL(string: "about:blank")!))
    }

    override func startAnimation() {
        super.startAnimation()
        if stopped {
            stopped = false
            load()
        }
    }

    override func animateOneFrame() {}

    override var hasConfigureSheet: Bool { false }
    override var configureSheet: NSWindow? { nil }

    deinit { DistributedNotificationCenter.default().removeObserver(self) }
}
