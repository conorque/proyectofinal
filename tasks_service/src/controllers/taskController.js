const axios = require('axios');
const Task = require('../models/task');


exports.createTask = async (req, res) => {
  try {
    const { taskcode, title, description, acceptance, startDate, endDate, devTime, state } = req.body;
    const t = new Task({
      taskcode,
      title,
      description,
      acceptance,
      startDate: new Date(startDate),
      endDate:   new Date(endDate),
      devTime,
      state,       
      assignedUser: null
    });
    await t.save();
    res.status(201).json(t);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.updateState = async (req, res) => {
  const { id }    = req.params;
  const { state } = req.body;        

  const allowed = ['Backlog','Doing','In Review','Done'];
  if (!allowed.includes(state))
    return res.status(400).json({ error: 'Estado inválido' });

  try {
    const task = await Task.findById(id);
    if (!task) 
      return res.status(404).json({ error: 'Task not found' });

    task.state = state;
    // if (state === 'Done') task.assignedUser = null;   para  forzar que assignedUser vaya a null:

    await task.save();
    res.json(task);

  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.assignUser = async (req, res) => {
  const { id }     = req.params;   
  const { userId } = req.body;     

  try {
    // 1) Cargo la tarea
    const task = await Task.findById(id);
    if (!task) 
      return res.status(404).json({ error: 'Tarea no encontrada' });

    // 2) Validación de estado
    if (task.state === 'Done') 
      return res.status(400).json({ error: 'No puedes asignar usuario a tarea finalizada' });

    const resp = await axios.get(`http://users_service:4000/api/users/${userId}`);
    const user = resp.data;

    // 4) Embede los datos que quieras
    task.assignedUser = {
      id:             user.id || user._id,
      identificacion: user.identificacion,
      nombres:        user.nombres,
      apellidos:      user.apellidos,
      edad:           user.edad,
      cargo:          user.cargo
    };

    // 5) Guarda la tarea
    await task.save();
    res.json(task);

  } catch (err) {
    // Si el users-service devolvió 404
    if (err.response && err.response.status === 404) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    // Otro error (red, validación, etc)
    res.status(400).json({ error: err.message });
  }
};

exports.getTasks = async (req, res) => {
    try {
        const tasks = await Task.find();
        res.status(200).json(tasks);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.getTask = async (req, res) => {
    try {
        const task = await Task.findById(req.params.id);
        if (!task) {
            return res.status(404).json({ error: 'Task not found' });
        }
        res.status(200).json(task);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};


exports.updateTask = async (req, res) => {
    try {
        const task = await Task.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!task) {
            return res.status(404).json({ error: 'Task not found' });
        }
        res.status(200).json(task);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

exports.deleteTask = async (req, res) => {
    try {
        const task = await Task.findByIdAndDelete(req.params.id);
        if (!task) {
            return res.status(404).json({ error: 'Task not found' });
        }
        res.status(200).json({ message: 'Task deleted' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
