// const dataALM = require('./src/back/data-ALM.js');
// const express = require('express');
import express from 'express';
import Datastore from 'nedb';
import { loadBackend_ALM } from './src/back/index-ALM.js';
import { loadBackend_EBT } from './src/back/index-EBT.js';

const app = express();
const PORT = process.env.PORT || 16078;

// Configuración de NeDB
// const db_ALM = new Datastore({ 
//     filename: './src/back/data-ALM.db', 
//     autoload: true 
// });

const db_ALM = new Datastore();
const db_EBT = new Datastore();

// Middleware
app.use("/", express.static("./public/"));
app.use(express.json()); // Habilita el parsing de JSON en las peticiones

app.get('/', (request, response) =>{
    response.send(`Este es el servidor del <a href="/about">grupo 11</a><br>
        <a href="/cool">Cool</a><br>
        <a href="/samples/EBT">Algoritmo EBT</a>
        <a href="/samples/ALM">Algoritmo ALM</a>
        <a href="/samples/MTP">Algoritmo MTP</a>`);
}
);


// Cargar el backend
loadBackend_ALM(app, db_ALM);
loadBackend_EBT(app);

// Iniciar el servidor
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});