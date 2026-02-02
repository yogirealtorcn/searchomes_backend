import express from 'express';
import { addproperty, updateproperty } from '../controller/productcontroller.js';

const propertyrouter = express.Router();

// No multer upload middleware needed
propertyrouter.post('/add', addproperty);
propertyrouter.post('/update', updateproperty);

export default propertyrouter;
