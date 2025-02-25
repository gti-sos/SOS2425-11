const data = require('./index-EBT.js');
const express = require('express');
const cool = require('cool-ascii-faces');
const app = express();
const PORT = process.env.PORT || 16078;

app.use("/about", express.static(__dirname + "/public/about.html"));


app.get('/cool', (request, response) =>{
    response.send(cool());
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
    response.send(Media_Jubilación_Andalucía);
}
);