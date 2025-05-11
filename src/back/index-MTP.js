const BASE_API = "/api/v1";
const RESOURCE_MTP = "management-evolutions";

function loadBackend_MTP(app, db) {

    //Redirect a la documentación

    app.get(BASE_API + `/${RESOURCE_MTP}/docs`, (request, response) => {
        return response.redirect("https://documenter.getpostman.com/view/42342450/2sB2izEDqp");

    });


    // Operaciones con colecciones de datos
    //LoadInitialData
    app.get(BASE_API + `/${RESOURCE_MTP}/loadInitialData`, (request, response) => {
        console.log(`New GET to /${RESOURCE_MTP}/loadInitialData`);

        // Primer paso, comprobar si hay datos previos.
        db.find({}, (err, existingData) => {
            if (err) {
                console.log(`Error: ${err}`);
                return response.status(500).send("Internal server error");
            }

            // En caso de que ya haya datos previos, no se sobreescriben

            if (existingData && existingData.length > 0) {
                console.log('Data already exists');
                return response.status(200).send('Data already exists');
            }

            //Datos iniciales 
            let initialData = [
                { year: 2024, place: "Andalucía", age: 1043, legal_residence: 1634, economical_resource: 6836, incompatible_benefit: 51 },
                { year: 2024, place: "Canarias", age: 153, legal_residence: 267, economical_resource: 611, incompatible_benefit: 29 },
                { year: 2024, place: "Murcia", age: 111, legal_residence: 102, economical_resource: 695, incompatible_benefit: 0 },
                { year: 2024, place: "Galicia", age: 78, legal_residence: 135, economical_resource: 587, incompatible_benefit: 3 },
                { year: 2024, place: "Madrid", age: 279, legal_residence: 127, economical_resource: 1927, incompatible_benefit: 7 },
                { year: 2023, place: "Teruel", age: 15, legal_residence: 33, economical_resource: 74, incompatible_benefit: 0 },
                { year: 2023, place: "Cadiz", age: 189, legal_residence: 674, economical_resource: 1649, incompatible_benefit: 12 },
                { year: 2023, place: "Comunitat Valenciana", age: 21, legal_residence: 12, economical_resource: 203, incompatible_benefit: 2 },
                { year: 2023, place: "País Vasco", age: 71, legal_residence: 102, economical_resource: 1008, incompatible_benefit: 11 },
                { year: 2022, place: "Cadiz", age: 39, legal_residence: 193, economical_resource: 1032, incompatible_benefit: 2 }
            ];
            //Insert de estos datos inciales
            db.insert(initialData, (err, newData) => {
                if (err) {
                    console.log(`Error: ${err}`);
                    return response.status(500).send('Internal server error');
                }
                console.log('Initial data loaded sucessfully');
                response.status(201).send('Initial data loaded sucessfully')
            });
        });
    });

    //GET: Obtener un recurso según una búsqueda por algun campo || Paginacion?


    app.get(BASE_API + `/${RESOURCE_MTP}`, (request, response) => {
        console.log(`New GET to /${RESOURCE_MTP}`, request.query);

        const { year, place, ageOver, ageUnder, legal_residenceOver, legal_residenceUnder, economical_resourceOver, economical_resourceUnder, incompatible_benefitOver, incompatible_benefitUnder, limit, offset } = request.query;

        //Construir el query para NEDB
        const query = {}; //Este es el objeto que NEDB usará para los filtros de las búsquedas

        if (year) {
            if (!(/^\d{4}$/.test(year))) {
                return response.status(400).send('Bad request, please provide a correct year format according to YYYY.');
            }
            query.year = parseInt(year);
        }
        if (place) query.place = place;

        if (ageOver || ageUnder) {
            query.age = {};
            if (ageOver) query.age.$gte = parseInt(ageOver);
            if (ageUnder) query.age.$lte = parseInt(ageUnder);
        }
        if (legal_residenceOver || legal_residenceUnder) {
            query.legal_residence = {};
            if (legal_residenceOver) query.legal_residence.$gte = parseInt(legal_residenceOver);
            if (legal_residenceUnder) query.legal_residence.$lte = parseInt(legal_residenceUnder);
        }
        if (economical_resourceOver || economical_resourceUnder) {
            query.economical_resource = {};
            if (economical_resourceOver) query.economical_resource.$gte = parseInt(economical_resourceOver);
            if (economical_resourceUnder) query.economical_resource.$lte = parseInt(economical_resourceUnder);
        }
        if (incompatible_benefitOver || incompatible_benefitUnder) {
            query.incompatible_benefit = {};
            if (incompatible_benefitOver) query.incompatible_benefit.$gte = parseInt(incompatible_benefitOver);
            if (incompatible_benefitUnder) query.incompatible_benefit.$lte = parseInt(incompatible_benefitUnder);
        }

        //Paginación
        const limitNum = parseInt(limit) || 10;
        const offSetNum = parseInt(offset) || 0;

        // Búsqueda según algun campo
        db.find(query)
            .skip(offSetNum)
            .limit(limitNum)
            .exec((err, applications) => {
                if (err) {
                    console.log(`Error: ${err}`);
                    return response.status(500).send('Internal Error');
                }

                //Si no hay datos lleva al loadInitData
                /*
                if (!(applications || applications.length === 0)) {
                    db.count({}, (err, count) => {
                        if (err) {
                            console.log(`Error: ${err}`);
                            return response.status(500).send('Internal error');
                        }
                        if (count === 0) {
                            console.log('Database empty, loading initial data');
                            return response.redirect(BASE_API + `/${RESOURCE_MTP}/loadInitialData`);
                        } else {
                            //En caso de que si haya datos pero no coincidan con el filtro devuelve error 404
                            console.log('No resources found matching the specified filter');
                            return response.status(404).send('No resources found matching the specified filter');
                        }
                    });
                } else {*/
                    //Si hay datos los envía
                    if (applications.length === 1) {
                        delete applications[0]._id; //Elimino el campo id pues es algo que crea NEDB automáticamente pero no debe verlo el usuario final.
                        response.status(200).send(applications[0]);
                    } else {
                        response.status(200).send(applications.map(r => { delete r._id; return r }));
                    }
                //}
            });
    });

    /*
    app.get(BASE_API, (req, res) => {
        console.log(`GET all management-evolutions`);
    
        db.find({}, (err, docs) => {
            if (err) {
                console.error("Database error:", err);
                return res.status(500).send("Internal Server Error");
            }
    
            if (!docs || docs.length === 0) {
                return res.status(404).send("No data found");
            }
    
            // Eliminamos el campo _id generado por NeDB
            const cleanedDocs = docs.map(doc => {
                delete doc._id;
                return doc;
            });
    
            res.status(200).json(cleanedDocs);
        });
    });
    */

    // Post: Para agregar un nuevo recurso a la coleccion
    app.post(BASE_API + `/${RESOURCE_MTP}`, (request, response) => {
        console.log(`New POST to /${RESOURCE_MTP}`);
        let newApplication = request.body;
        //Valido los campos requeridos
        if (!newApplication.year || !newApplication.place || !newApplication.age || !newApplication.legal_residence || !newApplication.economical_resource || !newApplication.incompatible_benefit) {
            return response.status(400).send('Missing required fields');
        }
        //Verifico campos duplicados
        db.findOne({ place: newApplication.place, year: newApplication.year }, (err, existingData) => {
            if (err) {
                console.log(`Error: ${err}`);
                return response.status(500).send('Internal error');
            }

            if (existingData) {
                return response.status(409).send('Data already exists');
            }

            //Añadimos el recurso 
            db.insert(newApplication, (err, newData) => {
                if (err) {
                    console.log(`Error: ${err}`);
                    return response.status(500).send('Internal error');
                }
                console.log('New data sucessfully added');
                return response.status(201).send('New data sucessfully added');
            })
        })
    });

    //Delete - Borrar una lista de recursos 
    app.delete(BASE_API + `/${RESOURCE_MTP}`, (request, response) => {
        console.log(`New DELETE to /${RESOURCE_MTP}`);

        db.remove({}, { multi: true }, (err, numDataRemoved) => {
            if (err) {
                console.log(`Error: ${err}`);
                return response.status(500).send('Internal error');
            }
            //Compruebo si no se ha eliminado nada, en ese caso vuelvo a lanzar error
            if (numDataRemoved === 0) {
                console.log('No data found');
                return response.status(404).send('Data not found');
            }
            //En caso de que si se haya eliminado devolvemos un 200-Ok
            //console.log(`Deleted ${numDataRemoved} resources`);
            response.status(204).end();
        })
    });

    //Put - Devuelve error porque no se puede hacer un put a una coleccion
    app.put(BASE_API + `/${RESOURCE_MTP}`, (request, response) => {
        console.log(`New PUT to /${RESOURCE_MTP}`);
        return response.status(405).send('Method not allowed');
    });

    //Operaciones con un solo recurso
    //Get
    app.get(BASE_API + `/${RESOURCE_MTP}/:place`, (request, response) => {
        //Lo dejo para que se pueda hacer según la ciudad, no sé si tengo que hacerlo para todos los campos
        const placeName = request.params.place;
        console.log(`New GET to /${RESOURCE_MTP}/${placeName}`);

        db.find({ place: placeName }, (err, resources) => {
            if (err) {
                console.log(`Error: ${err}`);
                return response.status(500).send('Internal error');
            }

            if (!resources || resources.length === 0) {
                console.log(`No data found for place ${placeName}`);
                return response.status(404).send('Resource not found');
            }

            if (resources.length === 1) { // En caso de que solo haya un elemento
                delete resources[0]._id;
                response.status(200).send(resources[0]);
            } else { // Si hay más de uno devuelvo el array
                response.status(200).send(resources.map(r => { delete r._id; return r }));
            }
        })
    });
    //Put
    app.put(BASE_API + `/${RESOURCE_MTP}/:place`, (request, response) => {
        const placeName = request.params.place;
        console.log(`New PUT to /${RESOURCE_MTP}/${placeName}`);

        //Comprobamos que el body no está vacio
        const newData = request.body;
        if (!newData || newData.length === 0) {
            return response.status(400).send("Bad request");
        }
        //Comprobar que el place se corresponde al del body
        if (newData.place && newData.place !== placeName) {
            return response.status(400).send("Bad request, parameter does not match Url´s");
        }
        //Comprobar la estructura mínima de datos
        const requiredFields = ['year', 'age', 'legal_residence', 'economical_resource', 'incompatible_benefit'];
        const missingFields = requiredFields.filter(field => !(field in newData));
        if (missingFields.length > 0) {
            return response.status(400).send(`Bad request, missing required fields ${missingFields}`);
        }

        db.update(
            { place: placeName },
            { $set: newData },
            { multi: true },
            (err, numReplaced) => {
                if (err) {
                    console.log(`Error: ${err}`);
                    return response.status(500).send('Internal error');
                }
                if (numReplaced === 0) {
                    console.log(`No resources found for place: ${placeName}`);
                    return response.status(404).send('Resource not found');
                }
                console.log(`Update ${numReplaced} resources for place: ${placeName}`);
                response.status(200).send(`Update ${numReplaced} resources sucessfully`);
            }
        )
    });
    //Delete 
    app.delete(BASE_API + `/${RESOURCE_MTP}/:place`, (request, response) => {
        const placeName = request.params.place;
        console.log(`New DELETE to /${RESOURCE_MTP}/${placeName}`);
        //Elimino todos los recursos que tengan ese place en común
        db.remove({ place: placeName }, { multi: true }, (err, numRemoved) => {
            if (err) {
                console.log(`Error: ${err}`);
                return response.status(500).send('Internal error');
            }
            //Si no se ha eliminado nada devuelvo error informando de que no se ha encontrado el recurso
            if (numRemoved === 0) {
                console.log(`No resource found for ${placeName}`);
                return response.status(404).send('Resource not found');
            }
            //Si si se ha eliminado devuelvo un 200 OK 
            console.log(`Deleted ${numRemoved} resources for place: ${placeName}`);
            response.status(204).end();
        })
    });

    //Post
    app.post(BASE_API + `/${RESOURCE_MTP}/:place`, (request, response) => {
        console.log(`New POST to /${RESOURCE_MTP}/${request.params.place}`);
        return response.status(405).send("Method not allowed. Cannot POST to a specific resource.");
    });

    //Gestion de relaciones
    //Get
    app.get(BASE_API + `/${RESOURCE_MTP}/:place/:year`, (request, response) => {
        const placeName = request.params.place;
        const yearNumber = request.params.year;
        const limit = parseInt(request.query.limit) || 0;
        const offset = parseInt(request.query.offset) || 0;
        console.log(`New GET to /${RESOURCE_MTP}/${placeName}/${yearNumber}?limit=${limit}&offset=${offset}`);
        //Valido que se proporcionen los dos parámetros
        if (!placeName || !yearNumber) {
            return response.status(400).send('Bad request, both year and place needed');
        }

        //Valido el formato del año
        if (!(/^\d{4}$/.test(yearNumber))) {
            return response.status(400).send("Bad Request. Please provide a valid year in YYYY format.");
        }

        //Valido la paginacion
        if (isNaN(limit) || limit < 0) {
            return response.status(400).send('Bad request, limit must be a positive number');
        }
        if (isNaN(offset) || offset < 0) {
            return response.status(400).send('Bad request, offset must be a positive number');
        }

        //Busco los recursos que coinciden con ese place & year
        db.find({ place: placeName, year: parseInt(yearNumber) })
            .skip(offset)
            .limit(limit)
            .exec((err, resources) => {
                if (err) {
                    console.log(`Error: ${err}`);
                    return response.status(500).send('Internal error');
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
            })
    });

    //Put
    app.put(BASE_API + `/${RESOURCE_MTP}/:place/:year`, (request, response) => {
        const placeName = request.params.place;
        const yearNumber = request.params.year;
        const newData = request.body;
        console.log(`New PUT to /${RESOURCE_MTP}/${placeName}/${yearNumber}`);

        // Valido el formato del año
        if (!(/^\d{4}$/.test(yearNumber))) {
            return response.status(400).send("Bad Request. Please provide a valid year in YYYY format.");
        }

        // Validamos que el body no esté vacío
        if (!newData || Object.keys(newData).length === 0) {
            return response.status(400).send("Bad Request. Request body cannot be empty");
        }

        // Valido que los campos en el body coincidan con los de la URL
        if (newData.place && newData.place !== placeName) {
            return response.status(400).send("Bad Request. Place in body must match URL parameter");
        }
        if (newData.year && newData.year !== parseInt(yearNumber)) {
            return response.status(400).send("Bad Request. Year in body must match URL parameter");
        }

        // Valido campos requeridos
        const requiredFields = ['age', 'legal_residence', 'economical_resource', 'incompatible_benefit'];
        const missingFields = requiredFields.filter(field => !(field in newData));
        if (missingFields.length > 0) {
            return response.status(400).send(`Bad Request. Missing required fields: ${missingFields.join(', ')}`);
        }

        // Actualizo el recurso
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
            });
    });

    //DELETE
    app.delete(BASE_API + `/${RESOURCE_MTP}/:place/:year`, (request, response) => {
        const placeName = request.params.place;
        const yearNumber = request.params.year;

        console.log(`New DELETE to /${RESOURCE_MTP}/${placeName}/${yearNumber}`);

        // Valido el formato del año
        if (!(/^\d{4}$/.test(yearNumber))) {
            return response.status(400).send("Bad Request. Please provide a valid year in YYYY format.");
        }

        // Elimino el recurso específico
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

    //POST
    app.post(BASE_API + `/${RESOURCE_MTP}/:place/:year`, (request, response) => {
        console.log(`New POST to /${RESOURCE_MTP}/${request.params.place}/${request.params.year}`);
        return response.status(405).send("Method not allowed. Cannot POST to a specific resource.");
    });
};
export { loadBackend_MTP };