
import Gtk from "gi://Gtk?version=4.0"
import { AppSource } from "./Apps"
import { WallpaperSource } from "./Wallpapers"
import { createBinding, createComputed, createState } from "ags" 

const items_per_page = 7

export interface SearchSource<T> {
    name: string
    query: (input: string) => T[]
    render: (item: T, selected: boolean) => JSX.Element
    activate: (item: T) => void
    reload?: () => void
}

const sources: SearchSource<any>[] = [ AppSource, WallpaperSource ]

const [selectedSource, setSelectedSource] = createState(0)
const [selectedItem, setSelectedItem] = createState(0)

const searchBuffer = new Gtk.EntryBuffer()
const searchText = createBinding(searchBuffer, "text")

const allItems = createComputed([selectedSource, searchText], (idx, text) => sources[idx].query(text))
const pageItems = createComputed([
    allItems,
    selectedItem,
], (items, idx) => {
    if (idx >= items.length) {
        idx = 0
        if (selectedItem.get() !== idx) setSelectedItem(idx)
    }

    const pageStart = items_per_page * Math.floor(idx / items_per_page)
    return items
        .slice(pageStart, pageStart + items_per_page)
        .map((it, i) => ({item: it, isSelected: idx % items_per_page === i}))
})

const reloadAll = () => {
    for (const source of sources) source?.reload?.()
    setSelectedSource(0)
}

const clear = () => {
    searchBuffer.text = ""
    setSelectedItem(0)
}

const switchSource = (direction: 1 | -1) => {
    const total = sources.length
    if (!total) return
    setSelectedSource(prev => (prev + direction + total) % total)
    clear()
}

const switchItem = (direction: 1 | -1) => {
    const total = allItems.get().length
    if (!total) return
    setSelectedItem(prev => (prev + direction + total) % total)
}

const launchSelected = () => {
    const items = allItems.get()
    const idx = selectedItem.get()
    const source = selectedSource.get()
sources[source].activate(items[idx])
}

export const Oracle = {
    sources,
    selectedItem,
    setSelectedItem,
    selectedSource,
    setSelectedSource,
    switchItem,
    switchSource,
    launchSelected,
    searchBuffer,
    pageItems,
    clear,
    allItems,
    reloadAll,
}
