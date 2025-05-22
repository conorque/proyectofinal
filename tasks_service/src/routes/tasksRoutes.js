const express = require('express');
const router = express.Router();
const taskController = require('../controllers/taskController');

router.get('/', taskController.getTasks);
router.get('/:id', taskController.getTask);
router.post   ('/',             taskController.createTask);
router.patch  ('/:id/assign',   taskController.assignUser);
router.patch  ('/:id/state',    taskController.updateState);
router.put('/:id', taskController.updateTask);
router.delete('/:id', taskController.deleteTask);

module.exports = router;
