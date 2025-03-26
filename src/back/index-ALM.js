const BASE_API = "/api/v1";
const RESOURCE_ALM = "autonomy-dependence-applications";

function loadBackend_ALM(app, db) {

    // GET: Obtiene datos del recurso
    app.get(BASE_API+`/${RESOURCE_ALM}`, (request, response) => {
        console.log(`New GET to /${RESOURCE_ALM}`)
        // Buscar todos los recursos en la base de datos
        db.find({}, (err, applications) => {
            // Manejo de errores
            if (err) {
                console.error('Error:', err);
                return response.status(500).send("Internal Error");
            }
            // Si no hay datos, redirige a /loadInitialData
            if (!applications || applications.length === 0) {
                console.log("No data found, redirecting to loadInitialData");
                return response.redirect(BASE_API+`/${RESOURCE_ALM}/loadInitialData`);
            }
            // Si hay datos, los enviamos
            const responseBody = applications.map((a => { delete a._id; return a; }));// Quitamos el _id y si hay más de un elemento, devolver el array normalmente
            response.status(200).json(responseBody);
        });
    });

    // GET => loadInitialData (al hacer un GET cree 10 o más datos en el array de NodeJS si está vacío)
    app.get(BASE_API+`/${RESOURCE_ALM}/loadInitialData`, (request, response) => {
        console.log(`New GET to /${RESOURCE_ALM}/loadInitialData`)
        // Primero verificamos si hay datos en la base de datos
        db.find({}, (err, existingData) => {
            if (err) {
                console.error('Error:', err);
                return response.status(500).send("Internal Error");
            }
            // Si ya hay datos, no los sobreescribimos
            if (existingData && existingData.length > 0) {
                console.log("Data already exists");
                return response.status(200).send("Data already loaded");
            }
            // Datos iniciales a insertar
            const initialData = [
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
                { year: 2024, place: "Extremadura", population: 1054306, dependent_population: 150537, request: 59450 }
            ];
            // Insertamos los datos iniciales
            db.insert(initialData, (err, newData) => {
                if (err) {
                    console.error('Error:', err);
                    return response.status(500).send("Internal Error");
                }
                console.log("Initial data loaded successfully");
                response.status(201).send("Initial data loaded successfully");
            });
        });
    });

    //POST: Agregar un nuevo recurso
    app.post(BASE_API+`/${RESOURCE_ALM}`, (request, response) => {
        console.log(`New POST to /${RESOURCE_ALM}`);
        let newApplication = request.body;
        // Validación básica de campos requeridos
        if (!newApplication.place || !newApplication.year || !newApplication.population || 
            !newApplication.dependent_population || !newApplication.request) {
            return response.status(400).send("Missing required fields");
        }
        // Verificamos duplicados
        db.findOne({ place: newApplication.place, year: newApplication.year }, (err, existingRec) => {
            if (err) {
                console.error('Error:', err);
                return response.status(500).send("Internal Error");
            }
            
            if (existingRec) {
                return response.status(409).send("Resource already exists");
            }
            // Insertamos nuevo recurso
            db.insert(newApplication, (err, newRec) => {
                if (err) {
                    console.error('Error:', err);
                    return response.status(500).send("Internal Error");
                }
                console.log("New resource added successfully");
                response.status(201).send("Resource created successfully");
            });
        });
    });

    //DELETE -> Borra lista de recursos, eliminando todos los datos
    app.delete(BASE_API + `/${RESOURCE_ALM}`, (request, response) => {
        console.log(`New DELETE to /${RESOURCE_ALM}`);

        db.remove({}, { multi: true }, (err, numRemoved) => {
            if (err) {
                console.error('Error:', err);
                return response.status(500).send("Internal Error");
            }
            // Si no se ha eliminado nada, devolvemos un error de que no se ha encontrado el recurso
            if (numRemoved === 0) {
                console.log(`No resources found`);
                return response.status(404).send("Resources not found");
            }
            // Si se ha eliminado, devolvemos un 204 (Success Delete, No Content)
            console.log(`Deleted ${numRemoved} resources`);
            response.status(204).end();
        });
    });

    //PUT -> DEVUELVE ERROR (NO SE PUEDE HACER PUT A UNA LISTA DE RECURSOS)
    app.put(BASE_API + `/${RESOURCE_ALM}`, (request, response) => {
        console.log(`New PUT to /${RESOURCE_ALM}`);
        return response.status(405).send("Method not allowed. Cannot PUT to a list of resources.");
    });


    //GESTIÓN DE UN RECURSO ESPECÍFICO
    //GET -> Obtiene datos del recurso place
    app.get(BASE_API+`/${RESOURCE_ALM}/places/:place`, (request, response) => {
        const placeName = request.params.place;
        console.log(`New GET to /${RESOURCE_ALM}/places/${placeName}`);

        db.find({ place: placeName }, (err, resources) => {
            if (err) {
                console.error('Error:', err);
                return response.status(500).send("Internal Error");
            }
            if (!resources || resources.length === 0) {
                console.log(`No data found for place: ${placeName}`);
                return response.status(404).send("Resource not found");
            }
            
            if (resources.length === 1) {
                // Si solo hay un elemento, devolverlo como objeto (sin _id)
                delete resources[0]._id;
                response.status(200).send(resources[0]);
            } else {
                // Si hay múltiples elementos, devolver array (sin _id)
                response.status(200).send(resources.map(r => { delete r._id; return r; })); // Quitamos el _id
            }
        });
    });

    //GET -> Busca datos del recurso por año
    app.get(BASE_API+`/${RESOURCE_ALM}/years/:year`, (request, response) => {
        const yearNumber = request.params.year;
        console.log(`New GET to /${RESOURCE_ALM}/years/${yearNumber}`);
        
        const limit = parseInt(request.query.limit) || 10;
        const offset = parseInt(request.query.offset) || 0;

        if (!(/^\d{4}$/.test(yearNumber))) {
            return response.status(400).send("Bad Request. Please provide a valid year in YYYY format.");
        }
        db.find({ year: parseInt(yearNumber) })
            .skip(offset)
            .limit(limit)
            .exec((err, resources) => {
                if (err) {
                    console.error('Error:', err);
                    return response.status(500).send("Internal Error");
                }

                if (!resources || resources.length === 0) {
                    console.log(`No data found for year: ${yearNumber}`);
                    return response.status(404).send("Resource not found");
                }
                if (resources.length === 1) {
                    // Si solo hay un elemento, devolverlo como objeto (sin _id)   
                    delete resources[0]._id;
                    response.status(200).send(resources[0]);
                } else {
                    // Si hay múltiples elementos, devolver array (sin _id)
                    response.status(200).send(resources.map(r => { delete r._id; return r; })); // Quitamos el _id
                }
            });
    });

    //GET -> Busca recursos por rango de población dependiente
    app.get(BASE_API+`/${RESOURCE_ALM}/dependent_population`, (request, response) => {
        const { min, max, limit, offset } = request.query;
        console.log(`New GET to /${RESOURCE_ALM}/dependent_population?min=${min}&max=${max}&limit=${limit}&offset=${offset}`);  

        // Parseamos los parámetros
        const minNum = parseInt(min);
        const maxNum = parseInt(max);
        const limitNum = parseInt(limit) || 5;
        const offsetNum = parseInt(offset) || 0;

        // Validamos que los parámetros sean números válidos
        if (isNaN(minNum) || isNaN(maxNum) || isNaN(limitNum) || isNaN(offsetNum)) {
            return response.status(400).send("Bad Request. Please provide valid numbers for min, max, limit, and offset.");
        }
        // Validamos que los números sean positivos
        if (minNum < 0 || maxNum < 0) {
            return response.status(400).send("Bad Request. Population values must be positive numbers.");
        }
        // Validamos que el rango sea válido
        if (minNum >= maxNum) {
            return response.status(400).send("Bad Request. Minimum population must be less than maximum population.");
        }

        // Buscamos los recursos que cumplen con los criterios de población dependiente
        db.find({ dependent_population: { $gte: minNum, $lte: maxNum } })
            .limit(limitNum)
            .skip(offsetNum)
            .exec((err, resources) => {
                if (err) {
                    console.error('Error:', err);
                    return response.status(500).send("Internal Error");
                }
                // Si no hay datos, devolvemos un error
                if (!resources || resources.length === 0) {
                    console.log(`No data found for population: ${minNum} - ${maxNum}`);
                    return response.status(404).send("Resource not found");
                }
                // Si hay un solo elemento, devolvemos un objeto (sin _id)
                if (resources.length === 1) {
                    delete resources[0]._id;
                    response.status(200).send(resources[0]);
                } else {
                    // Si hay múltiples elementos, devolvemos un array (sin _id)
                    response.status(200).send(resources.map(r => { delete r._id; return r; })); // Quitamos el _id
                }
            });
    });


    // PUT: Si existe "recurso" actualiza los datos
    app.put(BASE_API + `/${RESOURCE_ALM}/places/:place`, (request, response) => {
        const placeName = request.params.place;
        console.log(`New PUT to /${RESOURCE_ALM}/places/${placeName}`);

        // Validar que se envían datos en el body
        const newData = request.body;
        if (!newData || Object.keys(newData).length === 0) {
            return response.status(400).send("Bad Request. Request body cannot be empty");
        }
        // Validar que el place en el body coincide con el de la URL
        if (!newData.place || newData.place !== placeName) {
            return response.status(400).send("Bad Request. Place in body must match URL parameter");
        }
        // Validar estructura de datos mínima esperada
        const requiredFields = ['year', 'population', 'dependent_population', 'request'];
        const missingFields = requiredFields.filter(field => !(field in newData));
        if (missingFields.length > 0) {
            return response.status(400).send(`Bad Request. Missing required fields: ${missingFields.join(', ')}`);
        }

        db.update(
            { place: placeName },
            { $set: newData },
            { multi: true },
            (err, numReplaced) => {
                if (err) {
                    console.error('Error:', err);
                    return response.status(500).send("Internal Error");
                }
                if (numReplaced === 0) {
                    console.log(`No resources found for place: ${placeName}`);
                    return response.status(404).send("Resource not found");
                }
                console.log(`Updated ${numReplaced} resources for place: ${placeName}`);
                response.status(200).send(`Updated ${numReplaced} resources successfully`);
            }
        );
    });


    //DELETE -> Borra "recurso"
    app.delete(BASE_API+`/${RESOURCE_ALM}/places/:place`, (request, response) => {
        const placeName = request.params.place;
        console.log(`New DELETE to /${RESOURCE_ALM}/places/${placeName}`);
        // Eliminamos todos los recursos con el mismo place
        db.remove({ place: placeName }, { multi: true }, (err, numRemoved) => {
            if (err) {
                console.error('Error:', err);
                return response.status(500).send("Internal Error");
            }
            // Si no se ha eliminado nada, devolvemos un error de que no se ha encontrado el recurso
            if (numRemoved === 0) {
                console.log(`No resources found for place: ${placeName}`);
                return response.status(404).send("Resource not found");
            }
            // Si se ha eliminado, devolvemos un 204 (Success Delete, No Content)
            console.log(`Deleted ${numRemoved} resources for place: ${placeName}`);
            response.status(204).end();
        });
    });

    //POST -> DEVUELVE ERROR (NO SE PUEDE HACER POST A UN RECURSO CONCRETO)
    app.post(BASE_API + `/${RESOURCE_ALM}/places/:place`, (request, response) => {
        console.log(`New POST to /${RESOURCE_ALM}/places/${request.params.place}`);
        return response.status(405).send("Method not allowed. Cannot POST to a specific resource.");
    });
}

export { loadBackend_ALM };