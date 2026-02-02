import express from 'express';
import { addproperty, removeproperty, updateproperty, singleproperty } from '../controller/productcontroller.js';

const propertyrouter = express.Router();

// No multer upload middleware needed
propertyrouter.post('/add', addproperty);
propertyrouter.post('/remove', removeproperty);
propertyrouter.post('/update', updateproperty);
propertyrouter.get('/single/:id', singleproperty);

export default propertyrouter;
