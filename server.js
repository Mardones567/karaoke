// Importamos el módulo Express
const express = require('express');

// Creamos una instancia de Express
const app = express();

// Definimos el puerto en el que va a escuchar el servidor
const port = process.env.PORT || 3000;

// Servir archivos estáticos (si tienes una carpeta 'public' con archivos estáticos)
app.use(express.static('public'));

// Ruta principal
app.get('/', (req, res) => {
  res.send('¡Bienvenido al Karaoke!');
});

// Iniciamos el servidor y mostramos un mensaje en la consola
app.listen(port, () => {
  console.log(`Servidor corriendo en http://localhost:${port}`);
});
