
// This functions returns a function that takes a message and send it through the wire
//
// Usage: 
//
// sendMessage = setupWebsocket((d) => console.log("Received: ", d))
// sendMessage("lolilol")
export const setupWebsocket = async (eventCallback) => {
  const wsProtocol = location.protocol === "https:" ? "wss:" : "ws:";
  const url = `${wsProtocol}//${location.host}/feed`;
  window.socket = new WebSocket(url);
  window.client_id = -1
  window.socket.addEventListener("message", async (event) => {
    if (window.client_id == -1) {
      window.client_id = 999
      const view = new Uint8Array(await event.data.arrayBuffer());
      window.client_id = view[0];
      console.log("Got ID: ", window.client_id)
    }
    else {
      eventCallback(event.data)
    }
  })

  const waitForOpen = () => {
    if (socket.readyState === WebSocket.OPEN) {
      return Promise.resolve();
    }
    return new Promise((resolve, reject) => {
      socket.addEventListener("open", () => resolve());
      socket.addEventListener("error", (err) => reject(err));
    });
  };

  await waitForOpen();
  console.log("socket opened !")


  return (message) => {
    window.socket.send(message);
  }

  
}
