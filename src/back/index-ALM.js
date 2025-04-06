const BASE_API = "/api/v1";
const RESOURCE_ALM = "autonomy-dependence-applications";

function loadBackend_ALM(app, db) {

    //REDIRECT al portal de documentación
    app.get(BASE_API+`/${RESOURCE_ALM}/docs`, (request, response) => {
        return response.redirect("https://documenter.getpostman.com/view/42116317/2sAYkLnxYU");
    });

    // GET: Obtiene datos del recurso con búsquedas y paginación opcionales
    app.get(BASE_API+`/${RESOURCE_ALM}`, (request, response) => {
        console.log(`New GET to /${RESOURCE_ALM}`, request.query);
        
        const { 
            place, 
            year, 
            populationOver, 
            populationUnder,
            dependentPopulationOver,
            dependentPopulationUnder,
            requestOver,
            requestUnder,
            limit, 
            offset 
        } = request.query;

        // Construimos el query para NeDB
        const query = {}; // Este objeto es lo que NeDB usará para filtrar los documentos
        
        // Aplicamos filtros si están presentes
        if (place) query.place = place;
        if (year) {
            if (!(/^\d{4}$/.test(year))) {
                return response.status(400).send("Bad Request. Please provide a valid year in YYYY format.");
            }
            query.year = parseInt(year);
        }
        // $gte significa "greater than or equal to" 
        // $lte significa "less than or equal to"
        if (populationOver || populationUnder) {
            query.population = {};
            if (populationOver) query.population.$gte = parseInt(populationOver);
            if (populationUnder) query.population.$lte = parseInt(populationUnder);
        }
        if (dependentPopulationOver || dependentPopulationUnder) {
            query.dependent_population = {};
            if (dependentPopulationOver) query.dependent_population.$gte = parseInt(dependentPopulationOver);
            if (dependentPopulationUnder) query.dependent_population.$lte = parseInt(dependentPopulationUnder);
        }
        if (requestOver || requestUnder) {
            query.request = {};
            if (requestOver) query.request.$gte = parseInt(requestOver);
            if (requestUnder) query.request.$lte = parseInt(requestUnder);
        }

        // Configuración de paginación
        const limitNum = parseInt(limit) || 10; // cuántos elementos quieres que te devuelva en cada página
        const offsetNum = parseInt(offset) || 0; // cuántos elementos quieres que se salten antes de empezar a devolver

        // Buscar recursos en la base de datos
        db.find(query)
            .skip(offsetNum)
            .limit(limitNum)
            .exec((err, applications) => {
                if (err) {
                    console.error('Error:', err);
                    return response.status(500).send("Internal Error");
                }

                // Si no hay datos en la base de datos, redirige a /loadInitialData
                if (!applications || applications.length === 0) {
                    // Verificamos si la base de datos está completamente vacía
                    db.count({}, (err, count) => {
                        if (err) {
                            console.error('Error:', err);
                            return response.status(500).send("Internal Error");
                        }
                        if (count === 0) {
                            console.log("Database is empty, redirecting to loadInitialData");
                            return response.redirect(BASE_API+`/${RESOURCE_ALM}/loadInitialData`);
                        } else {
                            // Si hay datos pero no coinciden con los filtros, devolvemos 404
                            console.log("No resources found matching the specified filters");
                            return response.status(404).send("No resources found matching the specified filters");
                        }
                    });
                } else {
                    // Si hay datos, los enviamos
                    if (applications.length === 1) {
                        delete applications[0]._id;
                        response.status(200).send(applications[0]);
                    } else {
                        response.status(200).send(applications.map(r => { delete r._id; return r; }));
                    }
                }
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
    app.get(BASE_API+`/${RESOURCE_ALM}/:place`, (request, response) => {
        const placeName = request.params.place;
        console.log(`New GET to /${RESOURCE_ALM}/${placeName}`);

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

    // PUT: Si existe "recurso" actualiza los datos
    app.put(BASE_API + `/${RESOURCE_ALM}/:place`, (request, response) => {
        const placeName = request.params.place;
        console.log(`New PUT to /${RESOURCE_ALM}/${placeName}`);

        // Validar que se envían datos en el body
        const newData = request.body;
        if (!newData || Object.keys(newData).length === 0) {
            return response.status(400).send("Bad Request. Request body cannot be empty");
        }

        // Si se intenta modificar el place, devolver error
        if (newData.place && newData.place !== placeName) {
            return response.status(400).send("Bad Request. Place in body must match URL parameter");
        }

        // Eliminar el place del newData si existe para evitar actualizaciones no deseadas
        delete newData.place;

        // Validar campos y sus formatos
        const validFields = {
            year: {
                type: 'number',
                validate: (value) => /^\d{4}$/.test(value.toString())
            },
            population: {
                type: 'number',
                validate: (value) => value > 0
            },
            dependent_population: {
                type: 'number',
                validate: (value) => value >= 0
            },
            request: {
                type: 'number',
                validate: (value) => value >= 0
            }
        };

        // Verificar que los campos enviados son válidos
        const invalidFields = Object.keys(newData).filter(field => !validFields[field]);
        if (invalidFields.length > 0) {
            return response.status(400).send(`Bad Request. Invalid fields: ${invalidFields.join(', ')}`);
        }

        // Validar formato de los campos enviados
        for (const [field, value] of Object.entries(newData)) {
            const fieldConfig = validFields[field];
            
            // Validar tipo
            if (typeof value !== fieldConfig.type) {
                return response.status(400).send(`Bad Request. Field '${field}' must be of type ${fieldConfig.type}`);
            }

            // Validar formato específico
            if (!fieldConfig.validate(value)) {
                return response.status(400).send(`Bad Request. Invalid format for field '${field}'`);
            }
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
    app.delete(BASE_API+`/${RESOURCE_ALM}/:place`, (request, response) => {
        const placeName = request.params.place;
        console.log(`New DELETE to /${RESOURCE_ALM}/${placeName}`);
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
    app.post(BASE_API + `/${RESOURCE_ALM}/:place`, (request, response) => {
        console.log(`New POST to /${RESOURCE_ALM}/${request.params.place}`);
        return response.status(405).send("Method not allowed. Cannot POST to a specific resource.");
    });

    //GESTIÓN DE RELACIONES
    //GET -> Obtiene datos del recurso con mismo place y year
    app.get(BASE_API+`/${RESOURCE_ALM}/:place/:year`, (request, response) => {
        const placeName = request.params.place;
        const yearNumber = request.params.year;
        const limit = parseInt(request.query.limit) || 10;
        const offset = parseInt(request.query.offset) || 0;
        console.log(`New GET to /${RESOURCE_ALM}/${placeName}/${yearNumber}?limit=${limit}&offset=${offset}`);
        // Validamos que se proporcionen ambos parámetros
        if (!placeName || !yearNumber) {
            return response.status(400).send("Bad Request. Please provide both place and year parameters.");
        }

        // Validamos el formato del año
        if (!(/^\d{4}$/.test(yearNumber))) {
            return response.status(400).send("Bad Request. Please provide a valid year in YYYY format.");
        }
        // Validamos los parámetros de paginación
        if (isNaN(limit) || limit < 1) {
            return response.status(400).send("Bad Request. Limit must be a positive number.");
        }
        if (isNaN(offset) || offset < 0) {
            return response.status(400).send("Bad Request. Offset must be a non-negative number.");
        }
        // Buscamos los recursos que coinciden con place y year
        db.find({ place: placeName, year: parseInt(yearNumber) })
            .skip(offset)
            .limit(limit)
            .exec((err, resources) => {
                if (err) {
                    console.error('Error:', err);
                    return response.status(500).send("Internal Error");
                }

                if (!resources || resources.length === 0) {
                    console.log(`No data found for place: ${placeName} and year: ${yearNumber}`);
                    return response.status(404).send("Resource not found");
                }

                if (resources.length === 1) {
                    delete resources[0]._id;
                    response.status(200).send(resources[0]);
                } else {
                    response.status(200).send(resources.map(r => { delete r._id; return r; }));
                }
            });
    });

    //PUT: Si existe la relación, actualiza los datos
    app.put(BASE_API+`/${RESOURCE_ALM}/:place/:year`, (request, response) => {
        const placeName = request.params.place;
        const yearNumber = request.params.year;
        const newData = request.body;

        console.log(`New PUT to /${RESOURCE_ALM}/${placeName}/${yearNumber}`);

        // Validamos el formato del año
        if (!(/^\d{4}$/.test(yearNumber))) {
            return response.status(400).send("Bad Request. Please provide a valid year in YYYY format.");
        }

        // Validamos que el body no esté vacío
        if (!newData || Object.keys(newData).length === 0) {
            return response.status(400).send("Bad Request. Request body cannot be empty");
        }

        // Validamos que los campos en el body coincidan con los de la URL
        if (newData.place && newData.place !== placeName) {
            return response.status(400).send("Bad Request. Place in body must match URL parameter");
        }
        if (newData.year && newData.year !== parseInt(yearNumber)) {
            return response.status(400).send("Bad Request. Year in body must match URL parameter");
        }

        // Validamos campos requeridos
        const requiredFields = ['population', 'dependent_population', 'request'];
        const missingFields = requiredFields.filter(field => !(field in newData));
        if (missingFields.length > 0) {
            return response.status(400).send(`Bad Request. Missing required fields: ${missingFields.join(', ')}`);
        }

        // Actualizamos el recurso
        db.update(
            { place: placeName, year: parseInt(yearNumber) },
            { $set: newData },
            { multi: false },
            (err, numReplaced) => {
                if (err) {
                    console.error('Error:', err);
                    return response.status(500).send("Internal Error");
                }

                if (numReplaced === 0) {
                    console.log(`No resource found for place: ${placeName} and year: ${yearNumber}`);
                    return response.status(404).send("Resource not found");
                }

                console.log(`Updated resource for place: ${placeName} and year: ${yearNumber}`);
                response.status(200).send("Resource updated successfully");
            }
        );
    });

    //DELETE -> Borra la relación
    app.delete(BASE_API+`/${RESOURCE_ALM}/:place/:year`, (request, response) => {
        const placeName = request.params.place;
        const yearNumber = request.params.year;

        console.log(`New DELETE to /${RESOURCE_ALM}/${placeName}/${yearNumber}`);

        // Validamos el formato del año
        if (!(/^\d{4}$/.test(yearNumber))) {
            return response.status(400).send("Bad Request. Please provide a valid year in YYYY format.");
        }

        // Eliminamos el recurso específico
        db.remove(
            { place: placeName, year: parseInt(yearNumber) },
            { multi: false },
            (err, numRemoved) => {
                if (err) {
                    console.error('Error:', err);
                    return response.status(500).send("Internal Error");
                }

                if (numRemoved === 0) {
                    console.log(`No resource found for place: ${placeName} and year: ${yearNumber}`);
                    return response.status(404).send("Resource not found");
                }
                console.log(`Deleted resource for place: ${placeName} and year: ${yearNumber}`);
                response.status(204).end();
            }
        );
    });

    //POST -> DEVUELVE ERROR (NO SE PUEDE HACER POST A UN RECURSO CONCRETO)
    app.post(BASE_API + `/${RESOURCE_ALM}/:place/:year`, (request, response) => {
        console.log(`New POST to /${RESOURCE_ALM}/${request.params.place}/${request.params.year}`);
        return response.status(405).send("Method not allowed. Cannot POST to a specific resource.");
    });


}

export { loadBackend_ALM };