
import GLib from "gi://GLib"
import Gtk from "gi://Gtk?version=4.0"
import Gdk from "gi://Gdk?version=4.0"
import { execAsync } from "ags/process"
import { SearchSource } from "./Sources"
import { handleRequest } from "../../../request"
import { updateWallpaper } from "../../../wallpaper"
import { ensureThumbnail, thumbnailHash } from "../../store/thumbnails"

const WALLPAPER_DIR = GLib.getenv("AGS_WALLPAPER_DIR")!
// Displayed size (.wallpaper-thumb's min-width/min-height in launcher.scss)
// stays fixed at THUMB_W x THUMB_H; the cache is generated at a supersampled
// resolution so it stays sharp on HiDPI displays without needing to query any
// monitor's actual scale factor. Painted via a CSS background-image (not
// Gtk.Picture) because GtkPicture's natural size tracks its content's pixel
// size regardless of widthRequest/canShrink, so a sharper backing texture
// made the widget itself grow; CSS backgrounds never factor into layout size.
const THUMB_W = 80
const THUMB_H = 45
const THUMB_SCALE = 2

const display = () => Gdk.Display.get_default()!

let wallpapers: string[] = []
let thumbProvider: Gtk.CssProvider | null = null

function applyThumbCss(map: Map<string, string>) {
    const rules = [...map.entries()]
        .map(([filepath, thumb]) => `.wp-${thumbnailHash(filepath)} { background-image: url("file://${thumb}"); }`)
        .join("\n")

    const provider = new Gtk.CssProvider()
    provider.connect("parsing-error", (_, section, error) => {
        print(`Wallpaper thumbnail CSS error at ${section.get_start_location().lines + 1}: ${error.message}`)
    })
    provider.load_from_string(rules)

    if (thumbProvider) Gtk.StyleContext.remove_provider_for_display(display(), thumbProvider)
    Gtk.StyleContext.add_provider_for_display(display(), provider, Gtk.STYLE_PROVIDER_PRIORITY_APPLICATION + 1)
    thumbProvider = provider
}

function ensureThumbnails() {
    const map = new Map<string, string>()
    const queue = [...wallpapers]

    function processNext(): boolean {
        const filepath = queue.shift()
        if (!filepath) {
            applyThumbCss(map)
            return GLib.SOURCE_REMOVE
        }
        map.set(filepath, ensureThumbnail(filepath, THUMB_W * THUMB_SCALE, THUMB_H * THUMB_SCALE))
        return GLib.SOURCE_CONTINUE
    }

    GLib.idle_add(GLib.PRIORITY_DEFAULT_IDLE, processNext)
}

function loadWallpapers() {
    try {
        const dir = GLib.Dir.open(WALLPAPER_DIR, 0)
        wallpapers = []
        let filename: string | null
        while ((filename = dir.read_name())) {
            if (/\.(jpg|jpeg|png|webp)$/i.test(filename))
                wallpapers.push(`${WALLPAPER_DIR}/${filename}`)
        }
        wallpapers.sort((a, b) => a.localeCompare(b))
    } catch (err) {
        print("Error loading wallpapers:", err)
    }
    ensureThumbnails()
}

function fuzzyFilter(input: string) {
    if (!input) return wallpapers
    return wallpapers.filter(path => path.toLowerCase().includes(input.toLowerCase()))
}

function applyWallpaper(filepath: string) {
    handleRequest("launcher")
    execAsync(["awww", "img", filepath])
        .then(() => updateWallpaper(filepath))
        .catch(print)
}

export const WallpaperSource: SearchSource<string> = {
    name: "Wallpapers",
    query: fuzzyFilter,
    reload: loadWallpapers,
    render: (filepath, selected) => (
        <button
            canFocus={false}
            cssClasses={["wallpaper-item", selected ? "selected" : ""]}
            onClicked={() => applyWallpaper(filepath)}
        >
            <box spacing={12}>
                <box cssClasses={["wallpaper-thumb", `wp-${thumbnailHash(filepath)}`]} />
                <label label={GLib.path_get_basename(filepath).split(".")[0]} xalign={0} />
            </box>
        </button>
    ),
    activate: (filepath) => applyWallpaper(filepath),
}
