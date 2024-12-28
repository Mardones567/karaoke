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
const YOUTUBE_API_KEY = 'AIzaSyAwyAx7ayjZvupNpR6mea2gziXQ_tUn6h0';
const PLAYLIST_ID = 'PL8vad0sWoXX1SfUM5ptEirdqzd6ZZvyhm';

// Array que contendrá la playlist
let playlist = [];
let currentSong = null; // Variable para almacenar la canción actual
let isPaused = false; // Estado de la reproducción (pausada o en reproducción)

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
    playlist = response.data.items.map(item => ({
      song: item.snippet.title,
      videoId: item.snippet.resourceId.videoId,
      user: 'YouTube'
    }));
  } catch (error) {
    console.error('Error al obtener la playlist de YouTube:', error);
  }
}

// Cambiar a la siguiente canción en la lista
function nextSong() {
  const currentIndex = playlist.findIndex(song => song.videoId === currentSong.videoId);
  const nextIndex = (currentIndex + 1) % playlist.length; // Asegura que vuelva al principio cuando termine la lista
  currentSong = playlist[nextIndex];
  isPaused = false; // Reanudar la reproducción
  io.emit('song-playing', currentSong);
  io.emit('playback-state', { isPaused });
}

// Control de reproducción (pausar, continuar, siguiente)
function togglePlayPause() {
  isPaused = !isPaused;
  io.emit('playback-state', { isPaused });
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

// Ruta para establecer la canción actual
app.post('/play-song', express.json(), (req, res) => {
  const { song, videoId } = req.body;
  if (song && videoId) {
    currentSong = { song, videoId };
    isPaused = false; // Reanudar la reproducción
    io.emit('song-playing', currentSong); // Emitir la canción actual a los clientes
    io.emit('playback-state', { isPaused });
    res.status(200).send('Song is now playing');
  } else {
    res.status(400).send('Missing song or videoId');
  }
});

// Servir archivos estáticos (si tienes archivos como HTML, CSS, JS)
app.use(express.static('public'));

// Configurar WebSocket para manejar eventos
io.on('connection', (socket) => {
  console.log('A user connected');
  // Enviar la canción actual y el estado de reproducción cuando un usuario se conecta
  socket.emit('song-playing', currentSong);
  socket.emit('playback-state', { isPaused });

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
