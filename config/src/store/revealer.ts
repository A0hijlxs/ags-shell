
import { createState } from "ags"

export class RevealerManager {

    #activeState = createState<string | null>(null)
    #timeout: number | null = null

    get active() {
        return this.#activeState[0] 
    }
    get setActive() {
        return this.#activeState[1]
    }

    show(id: string) {
        if (this.active.get() === id) {
            this.setActive(null)
            this.#clearTimeout()
        } else {
            this.setActive(id)
            this.#clearTimeout()
        }
    }

    bind(id: string) {
        return this.active(active => active === id)
    }

    onHoverEnter(id: string) {
        if (this.active.get() === id) this.#clearTimeout()
    }

    onHoverLeave(id: string) {
        if (this.active.get() === id) this.#scheduleTimeout()
    }

    #clearTimeout() {
        if (this.#timeout) {
            clearTimeout(this.#timeout)
            this.#timeout = null
        }
    }

    #scheduleTimeout() {
        this.#clearTimeout()
        this.#timeout = setTimeout(() => {
            this.setActive(null)
        }, 1000)
    }
}

