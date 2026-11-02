
import GLib from "gi://GLib"
import GdkPixbuf from "gi://GdkPixbuf"

const CACHE_DIR = GLib.getenv("AGS_CACHE_DIR") ?? `${GLib.get_home_dir()}/.cache/ags`
const THUMBNAIL_DIR = `${CACHE_DIR}/wallpaper-thumbs`

export function thumbnailHash(filepath: string): string {
    return GLib.compute_checksum_for_string(GLib.ChecksumType.MD5, filepath, -1)!
}

export function thumbnailPath(filepath: string, w: number, h: number): string {
    return `${THUMBNAIL_DIR}/${thumbnailHash(filepath)}-${w}x${h}.png`
}

function generateThumbnail(filepath: string, dest: string, w: number, h: number) {
    GLib.mkdir_with_parents(THUMBNAIL_DIR, 0o755)
    const src = GdkPixbuf.Pixbuf.new_from_file(filepath)
    if (!src) return
    const scale = Math.max(w / src.get_width(), h / src.get_height())
    const scaledW = Math.round(src.get_width() * scale)
    const scaledH = Math.round(src.get_height() * scale)
    const scaled = src.scale_simple(scaledW, scaledH, GdkPixbuf.InterpType.BILINEAR)
    if (!scaled) return
    const x = Math.round((scaledW - w) / 2)
    const y = Math.round((scaledH - h) / 2)
    const thumb = GdkPixbuf.Pixbuf.new(GdkPixbuf.Colorspace.RGB, scaled.get_has_alpha(), 8, w, h)
    if (!thumb) return
    scaled.copy_area(x, y, w, h, thumb, 0, 0)
    thumb.savev(dest, "png", [], [])
}

export function ensureThumbnail(filepath: string, w: number, h: number): string {
    const dest = thumbnailPath(filepath, w, h)
    if (!GLib.file_test(dest, GLib.FileTest.EXISTS)) {
        try { generateThumbnail(filepath, dest, w, h) }
        catch (e) { print("Thumbnail error:", filepath, e) }
    }
    return dest
}
