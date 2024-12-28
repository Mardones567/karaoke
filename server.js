const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const axios = require('axios');

// Crear la aplicación Express
const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Configuración del puerto
const port = process.env.PORT || 3000;

// Reemplaza con tu clave de API de YouTube
const YOUTUBE_API_KEY = ''; // Reemplaza con tu clave de API de YouTube
const PLAYLIST_ID = 'PL8vad0sWoXX1SfUM5ptEirdqzd6ZZvyhm';

// Array que contendrá la playlist
let playlist = [];
let currentSong = null; // Video que está en ejecución

// Obtener los videos de la playlist de YouTube
async function getPlaylist() {
  try {
    const response = await axios.get(`https://www.googleapis.com/youtube/v3/playlistItems`, {
      params: {
        part: 'snippet',
        playlistId: PLAYLIST_ID,
        maxResults: 50,
        key: YOUTUBE_API_KEY
      }
    });

    // Extraer los videos de la playlist
    playlist = response.data.items.map(item => ({
      song: item.snippet.title,
      videoId: item.snippet.resourceId.videoId,
      user: 'YouTube'  // O puedes asignar algún usuario si se modifica la playlist
    }));

    // Si no hay un video actual, asignar el primer video
    if (!currentSong && playlist.length > 0) {
      setCurrentSong(playlist[0]); // Iniciar con el primer video de la lista
    }

    // Emitir la lista de reproducción actualizada
    io.emit('playlist-updated', playlist);
    io.emit('current-song-updated', currentSong);

  } catch (error) {
    console.error('Error al obtener la playlist de YouTube:', error);
  }
}

// Función para actualizar el video actual
function setCurrentSong(song) {
  currentSong = song;
  io.emit('current-song-updated', currentSong); // Emitir el video actual a los clientes
}

// Ruta para obtener la lista de canciones
app.get('/playlist', (req, res) => {
  res.json(playlist);
});

// Ruta para agregar una canción a la lista
app.post('/add-song', express.json(), (req, res) => {
  const { song, user } = req.body;
  if (song && user) {
    playlist.push({ song, user });
    io.emit('playlist-updated', playlist);  // Emitir evento a los clientes
    res.status(200).send('Song added');
  } else {
    res.status(400).send('Missing song or user');
  }
});

// Servir archivos estáticos (si tienes archivos como HTML, CSS, JS)
app.use(express.static('public'));

// Configurar WebSocket para manejar eventos
io.on('connection', (socket) => {
  console.log('A user connected');

  // Enviar la lista actual y el video actual al cliente cuando se conecte
  socket.emit('playlist-updated', playlist);
  socket.emit('current-song-updated', currentSong);

  socket.on('disconnect', () => {
    console.log('User disconnected');
  });
});

// Iniciar el servidor
server.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
  // Obtener la playlist al iniciar el servidor
  getPlaylist();
});
