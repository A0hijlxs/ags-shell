
const requestMap: Record<string, () => void> = {}

export function registerRequest(name: string, request: () => void) {
    requestMap[name] = request
}

export function handleRequest(request: string): string {
    if (request in requestMap) {
        requestMap[request]()
        return `${request} launched`
    }
    return `Unknown request: "${request}"`
}
