// MIT License — Copyright (c) 2026 Alex Vaos. See LICENSE.
// Loads the built FractalSpace.saver the way the screensaver host does, lets it
// run, and checks that the bundled page and an experiment actually loaded.
// Usage: swift macos/smoke.swift macos/build/FractalSpace.saver [snapshot.png]
import AppKit
import ScreenSaver
import WebKit

let arguments = CommandLine.arguments
guard arguments.count >= 2, let bundle = Bundle(path: arguments[1]), bundle.load(),
      let viewClass = bundle.principalClass as? ScreenSaverView.Type else {
    print("FAIL: could not load the saver bundle or its principal class"); exit(1)
}
let snapshotPath = arguments.count >= 3 ? arguments[2] : nil

let app = NSApplication.shared
app.setActivationPolicy(.accessory)
let frame = NSRect(x: 0, y: 0, width: 1280, height: 800)
let window = NSWindow(contentRect: frame, styleMask: [.titled], backing: .buffered, defer: false)
guard let saver = viewClass.init(frame: frame, isPreview: false) else { print("FAIL: view init returned nil"); exit(1) }
window.contentView = saver
window.makeKeyAndOrderFront(nil)
saver.startAnimation()

func findWebView(_ view: NSView) -> WKWebView? {
    if let web = view as? WKWebView { return web }
    for child in view.subviews { if let web = findWebView(child) { return web } }
    return nil
}

let probe = """
(() => {
  const on = document.querySelector('iframe.on');
  return JSON.stringify({
    href: location.href,
    loaderDone: document.querySelector('#loader')?.classList.contains('done') ?? false,
    frame: on?.getAttribute('src') ?? null,
    canvas: !!on?.contentDocument?.querySelector('canvas[data-screensaver]'),
    title: document.querySelector('#caption-title')?.textContent ?? ''
  });
})()
"""

var attempts = 0
func check() {
    attempts += 1
    guard let web = findWebView(saver) else { print("FAIL: no WKWebView"); exit(1) }
    web.evaluateJavaScript(probe) { result, error in
        let text = (result as? String) ?? "error: \(String(describing: error))"
        print("attempt \(attempts): hidden=\(web.isHidden) \(text)")
        let ok = !web.isHidden && text.contains("\"loaderDone\":true") && text.contains("\"canvas\":true")
        if ok || attempts >= 20 {
            let finish = {
                print(ok ? "PASS: saver loaded \(text)" : "FAIL: saver did not show an experiment")
                exit(ok ? 0 : 1)
            }
            guard let path = snapshotPath else { return finish() }
            web.takeSnapshot(with: nil) { image, _ in
                if let image, let tiff = image.tiffRepresentation, let rep = NSBitmapImageRep(data: tiff),
                   let png = rep.representation(using: .png, properties: [:]) {
                    try? png.write(to: URL(fileURLWithPath: path))
                }
                finish()
            }
        } else {
            DispatchQueue.main.asyncAfter(deadline: .now() + 1.5) { check() }
        }
    }
}
DispatchQueue.main.asyncAfter(deadline: .now() + 3) { check() }
app.run()
