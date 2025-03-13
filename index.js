const dataEBT = require('./index-EBT.js');
const dataALM = require('./index-ALM.js');
const express = require('express');
const cool = require('cool-ascii-faces');
const app = express();
const PORT = process.env.PORT || 16078;
const BASE_API = "/api/v1";
const RESOURCE_ALM = "autonomy-dependence-applications";


app.use("/about", express.static(__dirname + "/public/about.html"));
app.use(express.json()); // Habilita el parsing de JSON en las peticiones

app.get('/', (request, response) =>{
    response.send(`Este es el servidor del <a href="/about">grupo 11</a><br>
        <a href="/cool">Cool</a><br>
        <a href="/samples/EBT">Algoritmo EBT</a>
        <a href="/samples/ALM">Algoritmo ALM</a>`);
}
);


app.get('/cool', (request, response) =>{
    let caritas = cool();
    response.send(`${caritas}<br><a href="/">Volver</a>`);
}
);

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
}
);

// ~~~~~~~~~~~~~~~~~~~~ RECURSOS ~~~~~~~~~~~~~~~~~~~~
// GESTIÓN DE LISTA DE RECURSOS

//Lista de Recursos Antonio:
let applications = dataALM;
//let applications = [];

// GET: Obtiene datos del recurso
app.get(BASE_API+`/${RESOURCE_ALM}`, (request, response) => {
    console.log(`New GET to /${RESOURCE_ALM}`)

    //Si no hay datos, redirige a /loadInitialData
    if (applications.length === 0) {
        console.log("No hay datos. Redirigiendo a /loadInitialData...");
        response.redirect(BASE_API+`/${RESOURCE_ALM}/loadInitialData`);
        return; //Detiene ejecución para evitar doble respuesta
    }

    response.send(JSON.stringify(applications, null, 2));
});

// GET: Carga 10 datos iniciales en el array de NodeJS si está vacío
app.get(BASE_API+`/${RESOURCE_ALM}/loadInitialData`, (request, response) => {
    console.log(`New GET to /${RESOURCE_ALM}/loadInitialData`)
    if (applications.length === 0) {
        applications = [
            { year: 2024, place: "Andalucía", population: 8584147, dependent_population: 1014321, request: 423377 },
            { year: 2024, place: "Aragón", population: 1341289, dependent_population: 186533, request: 57909 },
            { year: 2024, place: "Asturias, Principado de", population: 1006060, dependent_population: 183865, request: 51282 },
            { year: 2024, place: "Balears, Illes", population: 1209906, dependent_population: 122472, request: 46233 },
            { year: 2024, place: "Canarias", population: 2213016, dependent_population: 253565, request: 75761 },
            { year: 2024, place: "Cantabria", population: 588387, dependent_population: 99920, request: 23556 },
            { year: 2024, place: "Castilla y León", population: 2383703, dependent_population: 409663, request: 160725 },
            { year: 2024, place: "Castilla - La Mancha", population: 2084086, dependent_population: 282068, request: 98880 },
            { year: 2024, place: "Cataluña", population: 7901963, dependent_population: 1040507, request: 382242 },
            { year: 2024, place: "Comunitat Valenciana", population: 5216195, dependent_population: 644872, request: 218328 },
            { year: 2024, place: "Extremadura", population: 1054306, dependent_population: 150537, request: 59450 },
        ];
        console.log("Datos iniciales cargados correctamente")
        response.send({ message: "Datos iniciales cargados correctamente", data: applications });
    } else {
        console.log("Datos ya existentes. No se sobreescriben.")
        response.send({ message: "Los datos ya estaban cargados", data: applications });
    }
});

//POST: Agregar un nuevo dato
app.post(BASE_API+`/${RESOURCE_ALM}`, (request, response) => {
    console.log(`New POST to /${RESOURCE_ALM}`);
    
    let newApplication = request.body;

    // Validamos que el objeto tiene todas las claves necesarias
    if (!newApplication.place || !newApplication.year || !newApplication.population || !newApplication.dependent_population || !newApplication.request) {
        return response.status(400).json({ error: "Faltan datos obligatorios en la solicitud." });
    }

    // Verificamos que no exista un recurso con el mismo place y year
    const exists = applications.some(application => application.place === newApplication.place && application.year === newApplication.year);
    if (exists) {
        return response.status(409).json({ error: "Ya existe un recurso con el mismo place y year." });
    }

    applications.push(newApplication);
    response.status(201).json({ message: "Recurso agregado correctamente", data: newApplication });
});

//DELETE -> Borra lista de recursos, eliminando todos los datos
app.delete(BASE_API + `/${RESOURCE_ALM}`, (request, response) => {
    console.log(`New DELETE to /${RESOURCE_ALM}`);

    // Verifica si ya está vacío
    if (applications.length === 0) {
        return response.status(404).json({ error: "No hay datos para eliminar." });
    }
    // Vacía el array
    applications = [];
    console.log("Todos los datos han sido eliminados.");
    response.status(200).json({ message: "Todos los datos han sido eliminados." });
});

//PUT -> DEVUELVE ERROR (NO SE PUEDE HACER PUT A UNA LISTA DE RECURSOS)
app.put(BASE_API + `/${RESOURCE_ALM}`, (request, response) => {
    console.log(`New PUT to /${RESOURCE_ALM}/${request.params.place}`);

    return response.status(405).json({
        error: "Método no permitido. No se puede hacer PUT a una lista de recursos."
    });
});


//GESTIÓN DE UN RECURSO (place)

//GET -> Obtiene datos del recurso place
app.get(BASE_API+`/${RESOURCE_ALM}/:place`, (request, response) => { // Los : en /:place indica que place es un parámetro dinámico en la URL. Esto significa que la ruta acepta valores variables en esa posición.
    const placeName = request.params.place;
    console.log(`New GET to /${RESOURCE_ALM}/${placeName}`)

    // Filtrar todos los recursos que coincidan con el place
    const resource = applications.filter(application => application.place === placeName);
    
    // const resource = applications.find(app => app.place === placeName) // 

    //Si no hay datos, redirige a /loadInitialData
    if (resource.length === 0) {
        return response.status(404).json({ error: "Recurso no encontrado" }); 
    }
    response.send(JSON.stringify(resource, null, 2));
});

//PUT -> Si existe "recurso" actualiza los datos
app.put(BASE_API + `/${RESOURCE_ALM}/:place`, (request, response) => {
    const placeName = request.params.place;
    console.log(`New PUT to /${RESOURCE_ALM}/${placeName}`);

    // Filtrar los índices de los recursos que coincidan con placeName
    const resourceIndexes = applications
        .map((application, index) => application.place === placeName ? index : -1)
        .filter(index => index !== -1);

    if (resourceIndexes.length === 0) {
        return response.status(404).json({ error: "Recurso no encontrado" });
    }

    const newData = request.body;

    // Validar que se envían datos en el body
    if (!newData || Object.keys(newData).length === 0) {
        return response.status(400).json({ error: "Datos inválidos o vacíos en la solicitud" });
    }

    // Actualizar todos los recursos que coincidan con el `placeName`
    resourceIndexes.forEach(index => {
        applications[index] = { ...applications[index], ...newData }; //... es el spread operator que permite combinar 2 objetos
    });

    response.json({
        message: `Recurso(s) con place '${placeName}' actualizado(s) correctamente`,
        updatedResources: applications.filter(application => application.place === placeName)
    });
});


//DELETE -> Borra "recurso"
app.delete(BASE_API+`/${RESOURCE_ALM}/:place`, (request, response) => {
    const placeName = request.params.place;
    console.log(`New DELETE to /${RESOURCE_ALM}/${placeName}`);

    // Filtra los índices de los elementos que coinciden con placeName
    // Guarda la longitud inicial para comparar
    const initialLength = applications.length;
    // Filtra eliminando elementos que coincidan y le asignamos el resultado a applications para que se efectúe el DELETE
    applications = applications.filter(application => application.place !== placeName);

    // Si no ha cambiado la longitud significa que se eliminó nada
    if (applications.length === initialLength) {
        return response.status(404).json({ error: "Recurso no encontrado" });
    }

    console.log(`Recursos con place=${placeName} eliminados.`);
    response.status(200).json({ message: `Recursos con place=${placeName} eliminados correctamente.` });
});

//POST -> DEVUELVE ERROR (NO SE PUEDE HACER POST A UN RECURSO CONCRETO)
app.post(BASE_API + `/${RESOURCE_ALM}/:place`, (request, response) => {
    console.log(`New POST to /${RESOURCE_ALM}/${request.params.place}`);

    return response.status(405).json({
        error: "Método no permitido. No se puede hacer POST a un recurso concreto."
    });
});











// ~~~~~~~~~~~~~~~~~~~~ ALGORITMOS ~~~~~~~~~~~~~~~~~~~~
// Algoritmo Edu:
let totalRetirementAmount = 0;
let count = 0;

dataEBT.forEach(item => {
    if (item.place === "Andalucía") {
        totalRetirementAmount += item.retirement_amount;
        count++;
    }
});

const Media_Jubilación_Andalucía = totalRetirementAmount / count;

app.get('/samples/EBT', (request, response) =>{
    response.send(`La media de la jubilación en Andalucía es ${Media_Jubilación_Andalucía} euros <br>
        <a href="/">Volver</a>`);
}
);

// Algoritmo Antonio:
// Filtramos los datos del año 2024 con dependent_population superior al 15% de population
const filteredData = dataALM.filter(item => 
    item.year === 2024 && (item.dependent_population / item.population) > 0.15
);

// Calculamos la media de la población dependiente usando map y reduce
const totalDependentPopulation = filteredData.map(item => item.dependent_population)
    .reduce((sum, value) => sum + value, 0);

// Calculamos la media de la población usando map y reduce
const totalPopulation = filteredData.map(item => item.population)
    .reduce((sum, value) => sum + value, 0);

const averageDependentPopulation = totalDependentPopulation / filteredData.length;
const averagePercentageDependentPopulation = totalDependentPopulation / totalPopulation;

app.get('/samples/ALM', (request, response) =>{
    response.send(`La media de esta población dependiente de los datos filtrados es de ${averageDependentPopulation.toFixed(2)} personas, que corresponde al ${averagePercentageDependentPopulation.toFixed(2)}% respecto a la población total. <br>
        <a href="/">Volver</a>`);
}
);

// ~~~~~~~~~~~~~~~~~~~~ ----------- ~~~~~~~~~~~~~~~~~~~~