// sources/AppSource.ts
import type { SearchSource } from "./Sources"
import Apps from "gi://AstalApps"
import { apps } from "../../store/apps"
import { exec } from "../../store/hypr"
import { handleRequest } from "../../../request"

const stripFieldCodes = (exec: string) =>
    exec.replace(/%[fFuUdDnNickvm]/g, "").replace(/%%/g, "%").replace(/\s+/g, " ").trim()

const launchApp = (app: Apps.Application) => {
    handleRequest("launcher")
    exec(stripFieldCodes(app.executable))
}

export const AppSource: SearchSource<Apps.Application> = {
    name: "Apps",
    query: (input) => apps.fuzzy_query(input),
    render: (app, selected) => (
        <button
            canFocus={false}
            css-classes={["app-button", selected ? "selected" : ""]}
            onClicked={() => launchApp(app)}
        >
            <box spacing={10}>
                <image iconName={app.iconName} />
                <label label={app.name} />
            </box>
        </button>
    ),
    activate: (app) => launchApp(app),
    reload: () => apps.reload(),
}
