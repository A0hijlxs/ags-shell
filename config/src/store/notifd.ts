
import Notifd from "gi://AstalNotifd"
import { createState } from "ags"

class NotificationMap {
    #map = new Map<number, Notifd.Notification>()

    #notifications = createState<Notifd.Notification[]>([])
    #count = createState(0)

    constructor() {
        notifd.connect("notified", (_, id) => {
            const n = notifd.get_notification(id)
            if (!n) return
            this.#add(id, n)

            setTimeout(() => {n.dismiss()}, TIMEOUT)
        })

        notifd.connect("resolved", (_, id) => {
            this.#remove(id)
        })
    }

    #update() {
        const values = [...this.#map.values()].reverse()
        this.#notifications[1](values)
        this.#count[1](values.length)
    }

    #add(id: number, notif: Notifd.Notification) {
        this.#map.set(id, notif)
        this.#update()
    }

    #remove(id: number) {
        this.#map.delete(id)
        this.#update()
    }

    getReactive() {return this.#notifications[0]}

    getCount() {return this.#count[0]}

    clear() {
        this.#map.clear()
        this.#update()
    }
}

const TIMEOUT = 5000

export const notifd = Notifd.get_default()
export const NotifMap = new NotificationMap()
export const Notifications = NotifMap.getReactive()
export const NotifCount = NotifMap.getCount()
