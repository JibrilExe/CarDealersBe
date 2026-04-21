let session_id = localStorage.getItem("session_id");

if (!session_id) {
    session_id = crypto.randomUUID();
    localStorage.setItem("session_id", session_id);
}

export function getSessionId() {
    return session_id;
}