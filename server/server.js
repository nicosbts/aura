const express = require('express');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

//Archivos estaticos
app.use(express.static(path.join(__dirname, '../public')));

//Ruta Pcal
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
});

//Iniciar el server
app.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
});