const BASE_API = "/api/v1";
const RESOURCE_EBT = "social-pension-payrolls";
import dataEBT from './data-EBT.js';


function loadBackend_EBT(app, db) {


    // GET: Obtiene datos del recurso
    app.get(BASE_API + `/${RESOURCE_EBT}`, (request, response) => {
        console.log(`New GET to /${RESOURCE_EBT}`, request.query);

        const { year,
            place,
            retirement_amountOver,
            retirement_amountUnder,
            disability_amountOver,
            disability_amountUnder,
            retirement_numberOver,
            retirement_numberUnder,
            disability_numberOver,
            disability_numberUnder,
            limit,
            offset }
            = request.query;

        const query = {};
        if (place) query.place = place;

        if (year && !/^\d{4}$/.test(year)) {
            return response.status(400).json({ error: "Invalid year" });
        }
        if (year) query.year = parseInt(year);

        if (retirement_amountOver || retirement_amountUnder) {
            query.retirement_amount = {};
            if (retirement_amountOver) query.retirement_amount.$gte = parseInt(retirement_amountOver);
            if (retirement_amountUnder) query.retirement_amount.$lte = parseInt(retirement_amountUnder);
        }

        if (disability_amountOver || disability_amountUnder) {
            query.disability_amount = {};
            if (disability_amountOver) query.disability_amount.$gte = parseInt(disability_amountOver);
            if (disability_amountUnder) query.disability_amount.$lte = parseInt(disability_amountUnder)
        }

        if (retirement_numberOver || retirement_numberUnder) {
            query.retirement_number = {};
            if (retirement_numberOver) query.retirement_number.$gte = parseInt(retirement_numberOver);
            if (retirement_numberUnder) query.retirement_number.$lte = parseInt(retirement_numberUnder);
        }

        if (disability_numberOver || disability_numberUnder) {
            query.disability_number = {};
            if (disability_numberOver) query.disability_number.$gte = parseInt(disability_numberOver);
            if (disability_numberUnder) query.disability_number.$lte = parseInt(disability_numberUnder)
        }

        const limitNum = parseInt(limit) || 10
        const offsetNum = parseInt(offset) || 0

        db.find({}, (err, contacts) => {
            if (contacts.length === 0) {
                console.log("No hay datos en la base de datos. Cargando datos iniciales...");
                db.insert(dataEBT, (err, newDocs) => {
                    if (err) {
                        console.error(`Error al insertar los datos: ${newDocs}`)
                    } else {
                        console.log("datos inciales cargados:", newDocs.length)
                    }
                });
            }
        });

        db.find(query).skip(offsetNum).limit(limitNum).exec((err, contacts) => {
            if (err) {
                console.error(`Error: ${err}`)
                return response.status(500).send("Internal Error")
            }
            if (!contacts || contacts.length === 0) {
                db.count({}, (err, count) => {
                    if (err) {
                        console.error(`Error: ${err}`)
                        return response.status(500).send("Internal Error")
                    }
                    if (count == 0) {
                        console.log("Database empty, loading data")
                        return response.redirect(BASE_API + `/${RESOURCE_EBT}/loadInitialData`)
                    }
                    console.log("No data found with the query:", query)
                    return response.status(404).send("No data matches the query")
                })
            } else {
                response.status(200).json(contacts.map(r => { delete r._id; return r }))
            }
        })



    });

    // GET: Carga 10 datos iniciales en el array de NodeJS si está vacío
    app.get(BASE_API + `/${RESOURCE_EBT}/loadInitialData`, (request, response) => {
        console.log(`New GET to /${RESOURCE_EBT}/loadInitialData`);

        db.find({}, (err, contacts) => {
            if (err) {
                console.log(`Error: ${err}`);
                return response.status(500).send("Internal server error");
            }
            if (contacts && contacts.length > 0) {
                console.log("Data already loaded");
                return response.status(200).send("Data already exists");
            }
            const amounts = [
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
            db.insert(amounts, (err, newContacts) => {
                if (err) {
                    console.log(`Unexpected error inserting data: ${err}`)
                    return response.status(500).send("Internal server error")
                }
                console.log("Data upload successful")
                response.status(201).send("Data loaded")
            });
        });
    });



    // POST: Agregar un nuevo dato
    app.post(BASE_API + `/${RESOURCE_EBT}`, (request, response) => {
        console.log(`New POST to /${RESOURCE_EBT}`);

        let newAmount = request.body;

        if (!newAmount.place || !newAmount.year || !newAmount.retirement_amount || !newAmount.disability_amount || !newAmount.retirement_number || !newAmount.disability_number) {
            console.error("Missing fields in the request body");
            return response.status(400).json({ error: "Fields missing" });
        }

        db.findOne({ place: newAmount.place, year: newAmount.year }, (err, exiResource) => {
            if (err) { console.log(`Error findOne:${err}`); return response.status(500).send("Internal error") }
            if (exiResource) {
                console.log("This resource already exists")
                return response.status(409).send("This resource already exists")
            } else {
                db.insert(newAmount, (err, succ) => {
                    if (err) { console.log(`Error insert:${err}`); return response.status(500).send("Internal error") }
                    console.log("Loaded resource")
                    response.status(201).send("Resource loaded succesfully")
                })
            }
        })

    });

    // DELETE: Borra lista de recursos, eliminando todos los datos
    app.delete(BASE_API + `/${RESOURCE_EBT}`, (request, response) => {
        console.log(`New DELETE to /${RESOURCE_EBT}`);

        db.remove({}, { multi: true }, (err, numbRemoved) => {
            if (err) {
                console.error(`Error eliminando todos los recursos: ${err}`)
                return response.status(500).send("Server Error")
            }
            if (numbRemoved == 0) {
                console.log("There is no resources to remove")
                return response.status(404).send("There is no resources")
            } else {
                console.log(`Elements removed:${numbRemoved}`)
                response.status(204).send("Elements succesfully removed")
            }
        })

    });

    // PUT: DEVUELVE ERROR (NO SE PUEDE HACER PUT A UNA LISTA DE RECURSOS)
    app.put(BASE_API + `/${RESOURCE_EBT}`, (request, response) => {
        console.log(`New PUT to /${RESOURCE_EBT}`);
        console.error(`Can not put a resource list`)
        return response.status(405).send(`Not allowed to PUT in a resource list`)
    });

    // GESTIÓN DE UN RECURSO (place)

    // GET: Obtiene datos del recurso place
    app.get(BASE_API + `/${RESOURCE_EBT}/:place`, (request, response) => {
        const placeName = request.params.place;
        console.log(`New GET to /${RESOURCE_EBT}/${placeName}`);

        db.find({ place: placeName }, (err, resources) => {
            if (err) {
                console.error(`Server Error getting resources by place : ${placeName}`)
            } if (resources.length == 0) {
                console.log(`No resource matches with place : ${placeName}`)
                return response.status(404).send(`No resource matches with place : ${placeName}`)
            }
            console.log(`${resources.length} displayed`)
            response.status(200).json(resources.map(r => { delete r._id; return r }))
        })
    });

    // PUT: Si existe "recurso" actualiza los datos
    app.put(BASE_API + `/${RESOURCE_EBT}/:place`, (request, response) => {
        const placeName = request.params.place;
        const newData = request.body;
        console.log(`New PUT to /${RESOURCE_EBT}/${placeName}`);


        if (!newData || Object.keys(newData).length === 0) {
            return response.status(400).json({ error: "Datos inválidos o vacíos en la solicitud" });
        }
        if (newData.place && newData.place !== placeName) {
            return response.status(400).json({ error: "La localización en el cuerpo de la solicitud no coincide con la localización en la URL." });
        }

        db.update({ place: placeName }, { $set: newData }, { multi: true }, (err, numUpdated) => {
            if (err) {
                console.error(`Error updating resource(s) with place '${placeName}': ${err}`);
                return response.status(500).send("Internal server error");
            }
            if (numUpdated === 0) {
                console.log(`No resource matches with place: ${placeName}`);
                return response.status(404).send(`No resource matches with place: ${placeName}`);
            }
            console.log(`Resource(s) with place '${placeName}' updated successfully`);
            response.status(200).json({
                message: `Resource(s) with place '${placeName}' updated successfully`,
                updatedCount: numUpdated
            });
        });

    });

    // DELETE: Borra "recurso"
    app.delete(BASE_API + `/${RESOURCE_EBT}/:place`, (request, response) => {
        const placeName = request.params.place;
        console.log(`New DELETE to /${RESOURCE_EBT}/${placeName}`);

        db.remove({ place: placeName }, { multi: true }, (err, remNumber) => {
            if (err) {
                console.error(`Server Error deleting resources by place : ${err}`)
                return response.status(500).send(`Internal Server Error`)
            }
            if (remNumber == 0) {
                console.log(`No resources found by place : ${placeName}`)
                return response.status(404).send(`No resources found`)
            }
            console.log(`${remNumber} resources succesfully removed`)
            response.status(204).send(`${remNumber} resources removed`)
        })
    });

    // POST: DEVUELVE ERROR (NO SE PUEDE HACER POST A UN RECURSO CONCRETO)
    app.post(BASE_API + `/${RESOURCE_EBT}/:place`, (request, response) => {
        console.log(`New POST to /${RESOURCE_EBT}/${request.params.place}`);

        return response.status(405).send(`Not allowed to POST to a resource`)
    });


    // Gestión de recursos concretos

    //GET 


    app.get(BASE_API + `/${RESOURCE_EBT}/:place/:year`, (request, response) => {
        const placeName = request.params.place;
        const yearNumber = request.params.year;
        const limit = parseInt(request.query.limit) || 10;
        const offset = parseInt(request.query.offset) || 0;
        console.log(`New GET to /${RESOURCE_EBT}/${placeName}/${yearNumber}?limit=${limit}&offset=${offset}`);

        if (yearNumber && !/^\d{4}$/.test(yearNumber)) {
            return response.status(400).json({ error: "Invalid or missing year" });
        }
        if (!placeName) {
            return response.status(400).json({ error: "Place name is required" });
        }

        if (isNaN(limit) || limit < 1) {
            return response.status(400).send("Limit must be a positive number.");
        }
        if (isNaN(offset) || offset < 0) {
            return response.status(400).send("Offset must be a non-negative number.");
        }
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
                    response.status(200).json(resources[0]);
                } else {
                    console.warn(`Multiple resources found for place: ${placeName} and year: ${yearNumber}`);
                    response.status(200).json(resources.map(r => { delete r._id; return r; }));
                }
            });
    });

    //PUT: Si existe la relación, actualiza los datos
    app.put(BASE_API + `/${RESOURCE_EBT}/:place/:year`, (request, response) => {
        const placeName = request.params.place;
        const yearNumber = request.params.year;
        const newData = request.body;

        if (!(/^\d{4}$/.test(yearNumber))) {
            return response.status(400).send("Bad Request. Please provide a valid year in YYYY format.");
        }

        if (!newData || Object.keys(newData).length === 0) {
            return response.status(400).send("Bad Request. Request body cannot be empty");
        }

        if (newData.place && newData.place !== placeName) {
            return response.status(400).send("Bad Request. Place in body must match URL parameter");
        }
        if (newData.year && newData.year !== parseInt(yearNumber)) {
            return response.status(400).send("Bad Request. Year in body must match URL parameter");
        }


        db.update(
            { place: placeName, year: parseInt(yearNumber) },
            { $set: newData },
            { multi: false },
            (err, numReplaced) => {
                if (err) {
                    console.error(`Error updating resource: ${err}`);
                    return response.status(500).send("Internal Error");
                }

                if (numReplaced === 0) {
                    console.log(`No resource found for place: ${placeName} and year: ${yearNumber}`);
                    return response.status(404).send("Resource not found");
                }
                console.log(`Resource for place: ${placeName} and year: ${yearNumber} updated successfully`);
                response.status(200).send("Resource updated successfully");
            }
        );


    });

    app.delete(BASE_API + `/${RESOURCE_EBT}/:place/:year`, (request, response) => {
        const placeName = request.params.place;
        const yearNumber = request.params.year;

        console.log(`New DELETE to /${RESOURCE_EBT}/${placeName}/${yearNumber}`);

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

    // POST -> DEVUELVE ERROR (NO SE PUEDE HACER POST A UN RECURSO CONCRETO)
    app.post(BASE_API + `/${RESOURCE_EBT}/:place/:year`, (request, response) => {
        console.log(`New POST to /${RESOURCE_EBT}/${request.params.place}/${request.params.year}`);
        return response.status(405).send("Not allowed to POST to a specific resource.");
    });

}

export { loadBackend_EBT };