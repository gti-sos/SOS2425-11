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