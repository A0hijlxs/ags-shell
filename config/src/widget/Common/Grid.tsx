import Gtk from "gi://Gtk?version=4.0"
import { With, Accessor } from "ags"

const { CENTER } = Gtk.Align
const { VERTICAL } = Gtk.Orientation

function chunk<T>(array: T[], size: number): T[][] {
    const result: T[][] = []
    for (let i = 0; i < array.length; i += size)
        result.push(array.slice(i, i + size))
    return result
}

type AutoGridProps<T> = {
    each: Accessor<T[]>
    perRow: number
    spacing?: number
    render: (item: T) => Gtk.Widget
}

export function AutoGrid<T>({
    each,
    perRow,
    spacing = 8,
    render,
}: AutoGridProps<T>) {
    return (
        <With value={each}>
            {(items) => (
                <box orientation={VERTICAL} spacing={spacing}>
                    {chunk(items, perRow).map((row, _) => (
                        <box spacing={spacing} halign={CENTER}>
                            {row.map(render)}
                        </box>
                    ))}
                </box>
            )}
        </With>
    )
}

