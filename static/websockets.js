
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

  window.socket.addEventListener("message", (event) => {
    eventCallback(event.data)
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


  return (message) => {
    window.socket.send(message);
  }

  
}
