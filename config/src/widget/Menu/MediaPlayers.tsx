
import Gtk from "gi://Gtk?version=4.0"
import Mpris from "gi://AstalMpris"
import Pango from "gi://Pango?version=1.0"
import { createBinding, For } from "ags"

const { CENTER } = Gtk.Align
const { VERTICAL } = Gtk.Orientation

function lengthStr(length: number) {
    const min = Math.floor(length / 60)
    const sec = Math.floor(length % 60)
    const sec0 = sec < 10 ? "0" : ""
    return `${min}:${sec0}${sec}`
}

function MediaPlayer({ player }: { player: Mpris.Player }) {
 
    const title = createBinding(player, "title").as(t => t || "Unknown Track")
    const artist = createBinding(player, "artist").as(a => a || "Unknown Artist")
    const coverArt = createBinding(player, "coverArt")

    const isPlaying = createBinding(player, "playbackStatus")
    // const looping = createBinding(player, "loopStatus")
    // const shuffling = createBinding(player, "shuffleStatus")

    const position = createBinding(player, "position")
    const length = createBinding(player, "length")

    return (
        <box>
            <image 
                file={coverArt} 
                // overflow={Gtk.Overflow.HIDDEN}
                pixelSize={80}/>

            <box orientation={VERTICAL}>
                <button 
                    onClicked={() => player.previous()}
                    label={""}/>

                <button 
                    onClicked={() => player.play_pause()}
                    label={isPlaying.as(a => a ? "" : "")} />

                <button onClicked={() => player.next()}
                    label={""} />
            </box>
            
            <box orientation={VERTICAL} valign={CENTER} >
                <label label={player.identity} />
                <label 
                    label={title} 
                    ellipsize={Pango.EllipsizeMode.END}
                    />
                <label 
                    label={artist} 
                    ellipsize={Pango.EllipsizeMode.END}
                    />
                <box>
                    <label label={position.as(p => lengthStr(p))} />
                    <slider
                        class={"track-slider"}
                        hexpand={true}
                        visible={length.as(l => l > 0)}
                        $={(self) => {
                            const drag = new Gtk.GestureDrag()
                            drag.connect("drag-end", () => {
                                player.position = self.value * player.length
                            })
                            self.add_controller(drag)
                        }}
                        value={position.as((position) => 
                            player.length > 0 ? position / player.length : 0
                        )}
                    />
                    <label label={length.as(l => lengthStr(l))} />
                </box>
            </box>
        </box>
    )
}


export function MediaMenu() {
    const mpris = Mpris.get_default()
    return (
        <box orientation={VERTICAL}>
            <For each={createBinding(mpris, "players")}>
                {(player: Mpris.Player) => <MediaPlayer player={player}/>}
            </For>
        </box>
    )
}

