package main

import (
	"fmt"
	"log"
	"net/http"
	"os"
	"strings"
	"sync"
	"time"

	"github.com/gorilla/websocket"
)

const (
	Port      = ":8000"
	TickRate  = 10 * time.Millisecond // ~10ms (90Hz)
	BatchSize = 200000                // Limite de taille par envoi pour ne pas saturer
)

var (
	ConnectedEvent    = []byte{4, 0}
	DisconnectedEvent = []byte{5, 0}
)

type Client struct {
	conn   *websocket.Conn
	cursor int
	id     int
}

type EventBuffer struct {
	buffer [][]byte       
	mu     sync.RWMutex   
}

type Hub struct {
	clients    map[*Client]bool
	clientsMu  sync.Mutex
	lastID     int
	buffer     *EventBuffer
	register   chan *Client
	unregister chan *Client
}

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool { return true }, // Accepte toutes les origines (CORS)
}

func NewEventBuffer() *EventBuffer {
	return &EventBuffer{
		buffer: make([][]byte, 0, 10000), 
	}
}

func (eb *EventBuffer) Append(data []byte) {
	eb.mu.Lock()
	eb.buffer = append(eb.buffer, data)
	eb.mu.Unlock()
}

func (eb *EventBuffer) Clear() {
	eb.mu.Lock()
	eb.buffer = eb.buffer[:0] // Reset rapide sans réallocation
	eb.mu.Unlock()
}


func NewHub() *Hub {
	return &Hub{
		clients:    make(map[*Client]bool),
		buffer:     NewEventBuffer(),
		register:   make(chan *Client),
		unregister: make(chan *Client),
	}
}

func (h *Hub) Run() {
	ticker := time.NewTicker(TickRate)
	defer ticker.Stop()

	for {
		select {
		case client := <-h.register:
			h.clientsMu.Lock()
			client.id = h.lastID
			h.lastID++
			h.clients[client] = true
			h.clientsMu.Unlock()
			client.conn.WriteMessage(websocket.BinaryMessage, []byte{byte(client.id)})
			
			// Notifie tout le monde qu'un user est arrivé
			h.buffer.Append(ConnectedEvent)

		case client := <-h.unregister:
			h.clientsMu.Lock()
			if _, ok := h.clients[client]; ok {
				delete(h.clients, client)
				client.conn.Close()
				// Notifie tout le monde qu'un user est parti
				h.buffer.Append(DisconnectedEvent)
			}
			h.clientsMu.Unlock()

		case <-ticker.C:
			h.broadcastBatch()
		}
	}
}

func (h *Hub) broadcastBatch() {
	// 1. On récupère la taille actuelle du buffer de manière thread-safe
	h.buffer.mu.RLock()
	bufferLen := len(h.buffer.buffer)
	h.buffer.mu.RUnlock()

	h.clientsMu.Lock()
	defer h.clientsMu.Unlock()

	for client := range h.clients {
		if client.cursor < bufferLen {
			end := client.cursor + BatchSize
			if end > bufferLen {
				end = bufferLen
			}

			h.buffer.mu.RLock()
			events := h.buffer.buffer[client.cursor:end]
			h.buffer.mu.RUnlock()

			totalSize := 0
			for _, e := range events {
				totalSize += len(e)
			}
			payload := make([]byte, totalSize)
			offset := 0
			for _, e := range events {
				copy(payload[offset:], e)
				offset += len(e)
			}

			err := client.conn.WriteMessage(websocket.BinaryMessage, payload)
			if err != nil {
				log.Printf("Erreur écriture client %d: %v", client.id, err)
				client.conn.Close()
				delete(h.clients, client)
				continue
			}

			client.cursor = end
		}
	}
}


func serveHome(w http.ResponseWriter, r *http.Request) {
	http.ServeFile(w, r, "./static/index.html")
}

func serveDraw(w http.ResponseWriter, r *http.Request) {
	http.ServeFile(w, r, "./static/draw.html")
}

func serveWS(hub *Hub, w http.ResponseWriter, r *http.Request) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Println("Upgrade error:", err)
		return
	}

	client := &Client{conn: conn, cursor: 0}
	hub.register <- client

	go func() {
		defer func() {
			hub.unregister <- client
		}()
		for {
			_, message, err := conn.ReadMessage()
			if err != nil {
				break
			}
			hub.buffer.Append(message)
		}
	}()
}

func handleClear(hub *Hub, w http.ResponseWriter, r *http.Request) {
	hub.buffer.Clear()
	hub.clientsMu.Lock()
	for client := range hub.clients {
		client.cursor = 0
	}
	hub.clientsMu.Unlock()
	http.Redirect(w, r, "/draw", http.StatusSeeOther)
}

func handleSave(hub *Hub, w http.ResponseWriter, r *http.Request) {
	name := r.URL.Query().Get("name")
	if name == "" {
		name = "eventdump.js"
	}

	hub.buffer.mu.RLock()
	defer hub.buffer.mu.RUnlock()

	var sb strings.Builder
	sb.WriteString("export const dumpBytes = new Uint8Array([")
	
	first := true
	for _, chunk := range hub.buffer.buffer {
		for _, b := range chunk {
			if !first {
				sb.WriteString(", ")
			}
			fmt.Fprintf(&sb, "0x%02x", b)
			first = false
		}
	}
	sb.WriteString("]);")

	err := os.WriteFile("static/saved/"+name+".js", []byte(sb.String()), 0644)
	if err != nil {
		http.Error(w, "Failed to save", http.StatusInternalServerError)
		return
	}
	w.Write([]byte("done"))
}

func main() {
	hub := NewHub()
	go hub.Run() // Lance la boucle de "tick" en arrière-plan

	fs := http.FileServer(http.Dir("./static"))
	http.Handle("/static/", http.StripPrefix("/static/", fs))

	http.HandleFunc("/", serveHome)
	http.HandleFunc("/load", serveHome) 
	http.HandleFunc("/draw", serveDraw)
	http.HandleFunc("/plan", serveDraw) 

	http.HandleFunc("/clear", func(w http.ResponseWriter, r *http.Request) {
		handleClear(hub, w, r)
	})
	http.HandleFunc("/save", func(w http.ResponseWriter, r *http.Request) {
		handleSave(hub, w, r)
	})
	
	http.HandleFunc("/feed", func(w http.ResponseWriter, r *http.Request) {
		serveWS(hub, w, r)
	})

	fmt.Printf("Serveur démarré sur http://localhost%s\n", Port)
	err := http.ListenAndServe(Port, nil)
	if err != nil {
		log.Fatal("ListenAndServe: ", err)
	}
}
