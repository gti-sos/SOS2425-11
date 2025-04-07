
// const app = express();
// const PORT = process.env.PORT || 16078;
// const BASE_API = "/api/v1";
// const RESOURCE_ALM = "autonomy-dependence-applications";
// const RESOURCE_MTP = "management-evolutions";
// const RESOURCE_EBT = "social-pension-payrolls"; 

import express from 'express';
import Datastore from 'nedb';
import path from 'path';
import { fileURLToPath } from 'url';

// Define __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import { loadBackend_ALM } from './src/back/index-ALM.js';
import { loadBackend_EBT } from './src/back/index-EBT.js';
import { loadBackend_MTP } from './src/back/index-MTP.js';

const app = express();
const PORT = process.env.PORT || 16078;

// Configuración de NeDB
// const db_ALM = new Datastore({ 
//     filename: './src/back/data-ALM.db', 
//     autoload: true 
// });

const db_ALM = new Datastore();
const db_EBT = new Datastore();
const db_MTP = new Datastore();

// Middleware
app.use("/", express.static("./public/"));
app.use(express.json()); // Habilita el parsing de JSON en las peticiones

app.use("/about", express.static(path.join(__dirname, "public", "about.html")));

app.get('/', (request, response) =>{
    response.send(`Este es el servidor del <a href="/about">grupo 11</a><br>
        <a href="/cool">Cool</a><br>
        <a href="/api/v1/social-pension-payrolls/docs/">API EBT</a>

        <a href="/samples/ALM">Algoritmo ALM</a>
        <a href="/samples/MTP">Algoritmo MTP</a>`);
}
);

app.get('/api/v1/social-pension-payrolls/docs', (request, response) => {
    response.redirect('https://documenter.getpostman.com/view/42128153/2sB2cUCP7v');
}
);


// Cargar el backend
loadBackend_ALM(app, db_ALM);
loadBackend_EBT(app, db_EBT);
loadBackend_MTP(app, db_MTP);

// Iniciar el servidor
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
