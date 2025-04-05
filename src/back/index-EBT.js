const BASE_API = "/api/v1";
const RESOURCE_EBT = "social-pension-payrolls";
import dataEBT from './data-EBT.js';

function loadBackend_EBT(app, db) {

    // // GESTIÓN DE LISTA DE RECURSOS EBT:
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

}

export { loadBackend_EBT};