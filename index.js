const dataEBT = require('./index-EBT.js');
const dataALM = require('./index-ALM.js');
const dataMTP = require('./index-MTP.js');
const express = require('express');
const cool = require('cool-ascii-faces');
const app = express();
const PORT = process.env.PORT || 16078;
const BASE_API = "/api/v1";
const RESOURCE_ALM = "autonomy-dependence-applications";
const RESOURCE_MTP = "management-evolutions-pensions";
const RESOURCE_EBT = "social-pension-payrolls"; 


app.use("/about", express.static(__dirname + "/public/about.html"));
app.use(express.json()); // Habilita el parsing de JSON en las peticiones

app.get('/', (request, response) =>{
    response.send(`Este es el servidor del <a href="/about">grupo 11</a><br>
        <a href="/cool">Cool</a><br>
        <a href="/samples/EBT">Algoritmo EBT</a>
        <a href="/samples/ALM">Algoritmo ALM</a>
        <a href="/samples/MTP">Algoritmo MTP</a>`);
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

    const newData = request.body;

    // Validar que se envían datos en el body
    if (!newData || Object.keys(newData).length === 0) {
        return response.status(400).json({ error: "Datos inválidos o vacíos en la solicitud" });
    }

    // Validar que el 'place' del body coincide con el 'place' de la URL
    if (newData.place !== placeName) {
        return response.status(400).json({ 
            error: `El 'place' del body ('${newData.place}') no coincide con el de la URL ('${placeName}')` 
        });
     }

    // Buscar el índice del recurso
     const index = applications.findIndex(application => application.place === placeName);
 
     if (index === -1) {
         return response.status(404).json({ error: "Recurso no encontrado" });
     }
 
 
     // Validar estructura de datos mínima esperada
     if (typeof newData.year !== 'number' ||
         typeof newData.population !== 'number' ||
         typeof newData.dependent_population !== 'number' ||
         typeof newData.request !== 'number') {
         return response.status(400).json({ error: "Estructura de datos inválida" });
     }
 
     // Actualizar el recurso
     applications[index] = { ...newData };
 
     return response.json({
         message: `Recurso con place '${placeName}' actualizado correctamente`,
         updatedResource: applications[index]
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

//#############################################################################################################################################################
//Gestion de una lista de recursos MTP:
let pensions = dataMTP;
//let pensions = [];
 
//GET   
app.get(BASE_API+`/${RESOURCE_MTP}`, (request, response) => {
    console.log(`New GET to /${RESOURCE_MTP}`)

    //Si no hay datos, redirige a /loadInitialData
    if (pensions.length == 0) {
        console.log("No hay datos. Redirigiendo a /loadInitialData...");
        response.redirect(BASE_API+`/${RESOURCE_MTP}/loadInitialData`);
        return; //Detiene ejecución para evitar doble respuesta
    }

    response.send(JSON.stringify(pensions, null, 2));
});


 // GET: Carga 10 datos iniciales en el array de NodeJS si está vacío
 app.get(BASE_API+`/${RESOURCE_MTP}/loadInitialData`, (request, response) => {
    console.log(`New GET to /${RESOURCE_MTP}/loadInitialData`)
    if (pensions.length === 0) {
        pensions = [
            { year: 2024, place: "Andalucía", age: 1043, legal_residence: 1634, economical_resource:6836, incompatible_benefit:51 },
            { year: 2024, place: "Almeria", age: 153, legal_residence: 267, economical_resource:611, incompatible_benefit:29 },
            { year: 2024, place: "Cadiz", age: 111, legal_residence: 102, economical_resource:695, incompatible_benefit:0 },
            { year: 2024, place: "Cordoba", age: 78, legal_residence: 135, economical_resource:587, incompatible_benefit:3 },
            { year: 2024, place: "Sevilla", age: 279, legal_residence: 127, economical_resource:1927, incompatible_benefit:7 },
            { year: 2023, place: "Teruel", age: 15, legal_residence: 33, economical_resource:74, incompatible_benefit:0 },
            { year: 2023, place: "Cadiz", age: 189, legal_residence: 674, economical_resource:1649, incompatible_benefit:12 },
            { year: 2023, place: "Zamora", age: 21, legal_residence: 12, economical_resource:203, incompatible_benefit:2 },
            { year: 2023, place: "Almeria", age: 71, legal_residence: 102, economical_resource:1008, incompatible_benefit:11 },
            { year: 2022, place: "Cadiz", age: 39, legal_residence: 193, economical_resource:1032, incompatible_benefit:2 }
        ];
        console.log("Datos iniciales cargados correctamente")
        response.send({ message: "Datos iniciales cargados correctamente", data: pensions });
    } else {
        console.log("Datos ya existentes. No se sobreescriben.")
        response.send({ message: "Los datos ya estaban cargados", data: pensions });
    }
});

//POST -- Añadir un nuevo dato
app.post(BASE_API+`/${RESOURCE_MTP}`, (request, response) => {
    console.log(`New POST to /${RESOURCE_MTP}`);
    let newPension = request.body;
    //Hay que validad que el objeto nuevo contenga todos los campos necesarios
    if(!newPension.place || !newPension.year || !newPension.age || !newPension.legal_residence || !newPension.economical_resource || !newPension.incompatible_benefit){ 
        return response.status(400).json({ error: "Faltan datos necesarios en la solicitud." });
    }

    //Verificar que no exista un recurso con el mismo place y year  
    const exists = pensions.some(pension => pension.place === newPension.place && pension.year === newPension.year);
    if(exists){
        return response.status(409).json({ error: "Ya existe un recurso con el mismo place y year." });
    }   

    applications.push(newPension);
    response.status(201).json({ message: "Recurso agregado correctamente", data: newPension }); 
});

// DELETE -> Borra lista de recursos, eliminando todos los datos
app.delete(BASE_API + `/${RESOURCE_MTP}`, (request, response) => {
    console.log(`New DELETE to /${RESOURCE_MTP}`);

    // Verifica si ya está vacío
    if (pensions.length === 0) {
        return response.status(404).json({ error: "No hay datos para eliminar." });
    }
    // Vacía el array
    pensions = [];
    console.log("Todos los datos han sido eliminados.");
    response.status(200).json({ message: "Todos los datos han sido eliminados." });
});

//PUT -> DEVUELVE ERROR (NO SE PUEDE HACER PUT A UNA LISTA DE RECURSOS)
app.put(BASE_API + `/${RESOURCE_MTP}`, (request, response) => {
    console.log(`New PUT to /${RESOURCE_MTP}/${request.params.place}`);

    return response.status(405).json({
        error: "Método no permitido. No se puede hacer PUT a una lista de recursos."   
    });
});

//#############################################################################################################################################################
//Gestión de un solo recurso MTP
//GET -> Obtiene datos del recurso place
app.get(BASE_API+`/${RESOURCE_MTP}/:place`, (request, response) => { // Los : en /:place indica que place es un parámetro dinámico en la URL. Esto significa que la ruta acepta valores variables en esa posición.
    const placeName = request.params.place;
    console.log(`New GET to /${RESOURCE_MTP}/${placeName}`)
    // Filtrar todos los recursos que coincidan con el place
    const resource = pensions.filter(pension => pension.place === placeName);
    //Si no hay datos, redirige a /loadInitialData
    if (resource.length === 0) {
        return response.status(404).json({ error: "Recurso no encontrado" });
    }
    response.send(JSON.stringify(resource, null, 2));
});

//PUT -> Si existe "recurso" actualiza los datos
app.put(BASE_API + `/${RESOURCE_MTP}/:place`, (request, response) => {
    const placeName = request.params.place;
    console.log(`New PUT to /${RESOURCE_MTP}/${placeName}`);
    // Filtrar los índices de los recursos que coincidan con placeName
    const resourceIndexes = pensions
        .map((pension, index) => pension.place === placeName ? index : -1)
        .filter(index => index !== -1);
    if (resourceIndexes.length === 0) {
        return response.status(404).json({ error: "Recurso no encontrado" });
    }
    const newData = request.body;
    // Validar que se envían datos en el body
    if (newData.place !== placeName || Object.keys(newData).length === 0) {
        return response.status(400).json({ error: "Datos inválidos o vacíos en la solicitud" });
    }   
    // Validar que el 'place' del body coincide con el 'place' de la URL
    if (newData.place !== placeName) {
        return response.status(400).json({ 
            error: `El 'place' del body ('${newData.place}') no coincide con el de la URL ('${placeName}')` 
        });
    }
    // Buscar el índice del recurso
    const index = applications.findIndex(application => application.place === placeName);
 
    if (index === -1) {
        return response.status(404).json({ error: "Recurso no encontrado" });
    }


    // Validar estructura de datos mínima esperada
    if (typeof newData.year !== 'number' ||
        typeof newData.population !== 'number' ||
        typeof newData.dependent_population !== 'number' ||
        typeof newData.request !== 'number') {
        return response.status(400).json({ error: "Estructura de datos inválida" });
    }

    // Actualizar el recurso
    applications[index] = { ...newData };

    return response.json({
        message: `Recurso con place '${placeName}' actualizado correctamente`,
        updatedResource: applications[index]
    });
}
);

//DELETE -> Borra "recurso"
app.delete(BASE_API+`/${RESOURCE_MTP}/:place`, (request, response) => {
    const placeName = request.params.place;
    console.log(`New DELETE to /${RESOURCE_MTP}/${placeName}`);
    // Filtra los índices de los elementos que coinciden con placeName
    // Guarda la longitud inicial para comparar
    const initialLength = pensions.length;
    // Filtra eliminando elementos que coincidan y le asignamos el resultado a pensions para que se efectúe el DELETE
    pensions = pensions.filter(pension => pension.place !== placeName);
    // Si no ha cambiado la longitud significa que no se eliminó nada
    if (pensions.length === initialLength) {
        return response.status(404).json({ error: "Recurso no encontrado" });
    }
    console.log(`Recursos con place=${placeName} eliminados.`);
    response.status(200).json({ message: `Recursos con place=${placeName} eliminados correctamente.` });
});

//POST -> DEVUELVE ERROR (NO SE PUEDE HACER POST A UN RECURSO CONCRETO)
app.post(BASE_API + `/${RESOURCE_MTP}/:place`, (request, response) => {
    console.log(`New POST to /${RESOURCE_MTP}/${request.params.place}`);

    return response.status(405).json({
        error: "Método no permitido. No se puede hacer POST a un recurso concreto."
    });
});

//#############################################################################################################################################################

// GESTIÓN DE LISTA DE RECURSOS EBT:
let amounts = dataEBT;

// GET: Obtiene datos del recurso
app.get(BASE_API + `/${RESOURCE_EBT}`, (request, response) => {
    console.log(`New GET to /${RESOURCE_EBT}`);

    // Si no hay datos, redirige a /loadInitialData
    if (amounts.length === 0) {
        console.log("No hay datos. Redirigiendo a /loadInitialData...");
        response.redirect(BASE_API + `/${RESOURCE_EBT}/loadInitialData`);
        return; // Detiene ejecución para evitar doble respuesta
    }

    response.send(JSON.stringify(amounts, null, 2));
});

// GET: Carga 10 datos iniciales en el array de NodeJS si está vacío
app.get(BASE_API + `/${RESOURCE_EBT}/loadInitialData`, (request, response) => {
    console.log(`New GET to /${RESOURCE_EBT}/loadInitialData`);
    if (amounts.length === 0) {
        amounts = [
            { year: 2024, place: "Andalucía", retirement_amount: 404470097.10, disability_amount: 302847557.70, retirement_number: 55139, disability_number: 36988 },
            { year: 2023, place: "Andalucía", retirement_amount: 364941392.88, disability_amount: 289993223.80, retirement_number: 53548, disability_number: 37922 },
            { year: 2022, place: "Andalucía", retirement_amount: 341025190.16, disability_amount: 282109979.85, retirement_number: 53634, disability_number: 39447 },
            { year: 2024, place: "Aragón", retirement_amount: 34782990.29, disability_amount: 18362096.46, retirement_number: 4818, disability_number: 2261 },
            { year: 2024, place: "Asturias", retirement_amount: 40525848.77, disability_amount: 26524389.53, retirement_number: 5651, disability_number: 3264 },
            { year: 2024, place: "Islas Baleares", retirement_amount: 41095463.37, disability_amount: 19572042.22, retirement_number: 5759, disability_number: 2364 },
            { year: 2024, place: "Canarias", retirement_amount: 184704737.20, disability_amount: 133732700.71, retirement_number: 25391, disability_number: 16885 },
            { year: 2024, place: "Cantabria", retirement_amount: 29809552.67, disability_amount: 24463176.04, retirement_number: 4315, disability_number: 3004 },
            { year: 2024, place: "Castilla y León", retirement_amount: 95586368.67, disability_amount: 64126180.04, retirement_number: 13598, disability_number: 7967 },
            { year: 2024, place: "Castilla-La Mancha", retirement_amount: 79494755.07, disability_amount: 66411366.10, retirement_number: 11333, disability_number: 8260 }
          ];
        console.log("Datos iniciales cargados correctamente");
        response.send({ message: "Datos iniciales cargados correctamente", data: amounts });
    } else {
        console.log("Datos ya existentes. No se sobreescriben.");
        response.send({ message: "Los datos ya estaban cargados", data: amounts });
    }
});

// POST: Agregar un nuevo dato
app.post(BASE_API + `/${RESOURCE_EBT}`, (request, response) => {
    console.log(`New POST to /${RESOURCE_EBT}`);

    let newAmount = request.body;

    // Validamos que el objeto tiene todas las claves necesarias
    if (!newAmount.place || !newAmount.year || !newAmount.retirement_amount || !newAmount.disability_amount || !newAmount.retirement_number || !newAmount.disability_number) {
        return response.status(400).json({ error: "Faltan datos obligatorios en la solicitud." });
    }

    // Verificamos que no exista un recurso con el mismo place y year
    const exists = amounts.some(amount => amount.place === newAmount.place && amount.year === newAmount.year);
    if (exists) {
        return response.status(409).json({ error: "Ya existe un recurso con el mismo place y year." });
    }

    amounts.push(newAmount);
    response.status(201).json({ message: "Recurso agregado correctamente", data: newAmount });
});

// DELETE: Borra lista de recursos, eliminando todos los datos
app.delete(BASE_API + `/${RESOURCE_EBT}`, (request, response) => {
    console.log(`New DELETE to /${RESOURCE_EBT}`);

    // Verifica si ya está vacío
    if (amounts.length === 0) {
        return response.status(404).json({ error: "No hay datos para eliminar." });
    }
    // Vacía el array
    amounts = [];
    console.log("Todos los datos han sido eliminados.");
    response.status(200).json({ message: "Todos los datos han sido eliminados." });
});

// PUT: DEVUELVE ERROR (NO SE PUEDE HACER PUT A UNA LISTA DE RECURSOS)
app.put(BASE_API + `/${RESOURCE_EBT}`, (request, response) => {
    console.log(`New PUT to /${RESOURCE_EBT}`);

    return response.status(405).json({
        error: "Método no permitido. No se puede hacer PUT a una lista de recursos."
    });
});

// GESTIÓN DE UN RECURSO (place)

// GET: Obtiene datos del recurso place
app.get(BASE_API + `/${RESOURCE_EBT}/:place`, (request, response) => {
    const placeName = request.params.place;
    console.log(`New GET to /${RESOURCE_EBT}/${placeName}`);

    // Filtrar todos los recursos que coincidan con el place
    const resource = amounts.filter(amount => amount.place === placeName);

    // Si no hay datos, redirige a /loadInitialData
    if (resource.length === 0) {
        return response.status(404).json({ error: "Recurso no encontrado" });
    }
    response.send(JSON.stringify(resource, null, 2));
});

// PUT: Si existe "recurso" actualiza los datos
app.put(BASE_API + `/${RESOURCE_EBT}/:place`, (request, response) => {
    const placeName = request.params.place;
    console.log(`New PUT to /${RESOURCE_EBT}/${placeName}`);

    // Filtrar los índices de los recursos que coincidan con placeName
    const resourceIndexes = amounts
        .map((amount, index) => amount.place === placeName ? index : -1)
        .filter(index => index !== -1);

    if (resourceIndexes.length === 0) {
        return response.status(404).json({ error: "Recurso no encontrado" });
    }
    
    const newData = request.body;

    // Validar que la localización en el body coincide con la localización en la URL
    if (newData.place && newData.place !== placeName) {
        return response.status(400).json({ error: "La localización en el cuerpo de la solicitud no coincide con la localización en la URL." });
    }

    // Validar que se envían datos en el body
    if (!newData || Object.keys(newData).length === 0) {
        return response.status(400).json({ error: "Datos inválidos o vacíos en la solicitud" });
    }

    // Actualizar todos los recursos que coincidan con el `placeName`
    resourceIndexes.forEach(index => {
        amounts[index] = { ...amounts[index], ...newData }; // ... es el spread operator que permite combinar 2 objetos
    });

    response.json({
        message: `Recurso(s) con place '${placeName}' actualizado(s) correctamente`,
        updatedResources: amounts.filter(amount => amount.place === placeName)
    });
});

// DELETE: Borra "recurso"
app.delete(BASE_API + `/${RESOURCE_EBT}/:place`, (request, response) => {
    const placeName = request.params.place;
    console.log(`New DELETE to /${RESOURCE_EBT}/${placeName}`);

    // Filtra los índices de los elementos que coinciden con placeName
    // Guarda la longitud inicial para comparar
    const initialLength = amounts.length;
    // Filtra eliminando elementos que coincidan y le asignamos el resultado a amounts para que se efectúe el DELETE
    amounts = amounts.filter(amount => amount.place !== placeName);

    // Si no ha cambiado la longitud significa que no se eliminó nada
    if (amounts.length === initialLength) {
        return response.status(404).json({ error: "Recurso no encontrado" });
    }

    console.log(`Recursos con place=${placeName} eliminados.`);
    response.status(200).json({ message: `Recursos con place=${placeName} eliminados correctamente.` });
});

// POST: DEVUELVE ERROR (NO SE PUEDE HACER POST A UN RECURSO CONCRETO)
app.post(BASE_API + `/${RESOURCE_EBT}/:place`, (request, response) => {
    console.log(`New POST to /${RESOURCE_EBT}/${request.params.place}`);

    return response.status(405).json({
        error: "Método no permitido. No se puede hacer POST a un recurso concreto."
    });
});


//#############################################################################################################################################################
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

//#############################################################################################################################################################

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

//#############################################################################################################################################################

// Algoritmo Mario:
//Vamos a calcular la media de pensiones rechazadas para personas con discapacidad en Cadiz anual
let contador = 0;
let sumaTotalCadiz = 0;

dataMTP.forEach(item =>{
    if(item.place == "Cadiz"){
        sumaTotalCadiz+= item.age + item.legal_residence + item.economical_resource + item.incompatible_benefit;
        contador++;
    } 
});

const mediaAnualCadiz = sumaTotalCadiz/contador;
app.get('/samples/MTP', (request, response) =>{
    response.send(`La media anual de pensiones rechazadas para personas con discapacidad en Cadiz es de ${mediaAnualCadiz} pensiones. <br>
        <a href="/">Volver</a>`);
})

// ~~~~~~~~~~~~~~~~~~~~ ----------- ~~~~~~~~~~~~~~~~~~~~