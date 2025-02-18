const data = [
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

let totalRetirementAmount = 0;
let count = 0;

data.forEach(item => {
    if (item.place === "Andalucía") {
        totalRetirementAmount += item.retirement_amount;
        count++;
    }
});

const Media_Jubilación_Andalucía = totalRetirementAmount / count;
console.log(`La media de la jubilación en Andalucía es ${Media_Jubilación_Andalucía} euros`);