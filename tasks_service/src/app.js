const express = require('express');
const dotenv = require('dotenv');
const mongoose = require('mongoose');

const tasksRoutes = require('./routes/tasksRoutes');

dotenv.config();

const app = express();
const port = process.env.PORT || 3002;

app.use(express.json());
app.use('/api/tasks', tasksRoutes);

mongoose.connect(process.env.DB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log('Connected to MongoDB');
    app.listen(port, () => {
        console.log(`Server running on port ${port}`);
    });
}).catch(err => {
    console.error('Error connecting to MongoDB', err);
});