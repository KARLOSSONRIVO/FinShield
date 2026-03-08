// ZAP HTTP Sender Script: Inject Bearer token on all outgoing requests
// Token is provided via ZAP_BEARER_TOKEN environment variable (Docker -e flag)

def TOKEN = System.getenv("ZAP_BEARER_TOKEN")

def sendingRequest(msg, initiator, helper) {
    if (TOKEN != null && !TOKEN.isEmpty()) {
        msg.getRequestHeader().setHeader("Authorization", "Bearer " + TOKEN)
    }
}

def responseReceived(msg, initiator, helper) {
    // Nothing to do on response
}
