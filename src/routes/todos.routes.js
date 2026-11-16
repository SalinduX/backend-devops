const router = require('express').Router();
const ctrl = require('../controllers/todos.controller');
const { requireAuth } = require('../middleware/auth');
const validate = require('../middleware/validate');
const validateId = require('../middleware/validateId');
const asyncHandler = require('../middleware/asyncHandler');
const { createTodoSchema, updateTodoSchema, listQuerySchema } = require('../schemas');

router.use(requireAuth); // මේ router එකේ හැම route එකකටම login ඕන

router.get('/', validate(listQuerySchema, 'query'), asyncHandler(ctrl.list));
router.get('/:id', validateId, asyncHandler(ctrl.getOne));
router.post('/', validate(createTodoSchema), asyncHandler(ctrl.create));
router.put('/:id', validateId, validate(updateTodoSchema), asyncHandler(ctrl.update));
router.delete('/:id', validateId, asyncHandler(ctrl.remove));

module.exports = router;