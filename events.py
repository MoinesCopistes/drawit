# This only contains event types the server actually need to understand.

ASK_SNAPSHOT_EVENT = lambda client_id: bytes([4] + 8*[0] + [client_id])
