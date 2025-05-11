import express from "express";
import cors from "cors";
import  { loadBackend_EBT, loadBackend_ALM, db_EBT, db_ALM, loadBackend_MTP, db_MTP} from "./src/back/index.js";
import { handler } from './src/front/build/handler.js';
 
const app = express();
const PORT = process.env.PORT || 16078;

app.use(express.json());
app.use(cors());


loadBackend_EBT(app, db_EBT);
loadBackend_ALM(app, db_ALM); 
loadBackend_MTP(app, db_MTP);

app.use(handler);

app.listen(PORT,()=>{
    console.log(`Server running on port ${PORT}!`);
});