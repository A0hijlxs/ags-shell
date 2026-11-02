import Gtk from "gi://Gtk?version=4.0"
import Gdk from "gi://Gdk?version=4.0"
import { execAsync } from "ags/process"
import { ensureThumbnail } from "./src/store/thumbnails"

const display = () => Gdk.Display.get_default()!

// Larger than any workspace preview box (monitor.width/12, so ~320px even at 4K)
// but far smaller than the 4K-8K source wallpapers, to avoid decoding those at
// full resolution just to paint a background swatch.
const BG_THUMB_W = 640
const BG_THUMB_H = 360

let wallpaperProvider: Gtk.CssProvider | null = null

function applyWallpaperCss(url: string) {
    const provider = new Gtk.CssProvider()
    provider.load_from_string(`.wallpaper { background-image: url("${url}"); }`)

    if (wallpaperProvider) Gtk.StyleContext.remove_provider_for_display(display(), wallpaperProvider)
    Gtk.StyleContext.add_provider_for_display(display(), provider, Gtk.STYLE_PROVIDER_PRIORITY_APPLICATION + 1)
    wallpaperProvider = provider
}

export function updateWallpaper(path: string) {
    const thumb = ensureThumbnail(path, BG_THUMB_W, BG_THUMB_H)
    applyWallpaperCss(`file://${thumb}`)
}

export function setupWallpaper() {
    execAsync(["awww", "query"])
        .then(output => {
            if (typeof output !== "string") return
            const match = /image:\s*(\S+)/.exec(output)
            if (match) updateWallpaper(match[1])
        })
        .catch(() => {})
}
