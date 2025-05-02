// const app = express();
// const PORT = process.env.PORT || 16078;
const BASE_API = "/api/v1";
const RESOURCE_ALM = "autonomy-dependence-applications";
const RESOURCE_MTP = "management-evolutions";
const RESOURCE_EBT = "social-pension-payrolls";

import express from 'express';
import Datastore from '@seald-io/nedb';
import path from 'path';
import { fileURLToPath } from 'url';

// Define __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import { loadBackend_ALM } from './index-ALM.js';
import { loadBackend_EBT } from './index-EBT.js';
import { loadBackend_MTP } from './index-MTP.js';

const app = express();
const PORT = process.env.PORT || 16078;

const db_ALM = new Datastore();
const db_EBT = new Datastore();
const db_MTP = new Datastore();
app.use((req, res, next) => {
    console.log(`--> Request Received: ${req.method} ${req.path}`);
    console.log("    Headers:", req.headers);
    // Importante: No intentes leer req.body aquí antes de express.json()
    next(); // Pasa a la siguiente función middleware
});


// Middleware
app.use("/", express.static("./public/"));
app.use(express.json()); // Habilita el parsing de JSON en las peticiones

app.use("/about", express.static(path.join(__dirname, "public", "about.html")));

app.get('/', (request, response) => {
    response.send(`Este es el servidor del <a href="/about">grupo 11</a><br>
        <a href="/about">About</a><br>
        <a href="/api/v1/social-pension-payrolls/docs/">API EBT</a>
        <a href="/api/v1/autonomy-dependence-applications/docs/">API ALM</a>
        <a href="/api/v1/management-evolutions/docs/">API MTP</a>
        `);
}
);

app.get('/api/v1/social-pension-payrolls/docs', (request, response) => {
    return response.redirect('https://documenter.getpostman.com/view/42128153/2sB2cUCP7v');
});

app.get(BASE_API + `/${RESOURCE_ALM}/docs`, (request, response) => {
    return response.redirect("https://documenter.getpostman.com/view/42116317/2sAYkLnxYU");
});

app.get(BASE_API + `/${RESOURCE_MTP}/docs`, (request, response) => {
    return response.redirect("https://documenter.getpostman.com/view/42116317/2sAYkLnxYU");

});

// Cargar el backend
loadBackend_ALM(app, db_ALM);
loadBackend_EBT(app, db_EBT);
loadBackend_MTP(app, db_MTP);

// Iniciar el servidor
/*
app.listen(PORT,()=>{
    console.log(`Server running on port ${PORT}!`);
});
*/


export{loadBackend_EBT, loadBackend_ALM, loadBackend_MTP, db_ALM, db_EBT, db_MTP};


