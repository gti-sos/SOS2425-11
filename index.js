const data = require('./index-EBT.js');
const express = require('express');
const cool = require('cool-ascii-faces');
const app = express();
const PORT = process.env.PORT || 16078;

app.use("/about", express.static(__dirname + "/public/about.html"));

app.get('/', (request, response) =>{
    response.send(`Este es el servidor del <a href="/about">grupo 11</a><br>
        <a href="/cool">Cool</a><br>
        <a href="/samples/EBT">Algoritmo EBT</a>`);
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

// Algoritmo Edu:
let totalRetirementAmount = 0;
let count = 0;

data.forEach(item => {
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
const filteredData = data.filter(item => 
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