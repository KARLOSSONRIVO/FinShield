import { Router } from "express";
import { validate } from "../../common/middlewares/validate.middleware.js";
import { allowRoles } from "../../common/middlewares/rbac.middleware.js";
import { createAssignmentSchema, updateAssignmentSchema } from "../../modules/validators/assignment.validator.js";
import * as AssignmentController from "../../modules/controllers/assignment.controller.js";

const assignmentRouter = Router();

// Auth and password change enforcement handled in index.js

assignmentRouter.post('/createAssignment', validate(createAssignmentSchema), allowRoles("SUPER_ADMIN"), AssignmentController.createAssignment)

assignmentRouter.get('/listAssignments', allowRoles("SUPER_ADMIN"), AssignmentController.listAssignments)

assignmentRouter.get('/:id', allowRoles("SUPER_ADMIN"), AssignmentController.getAssignmentById)

assignmentRouter.put('/updateAssignment/:id', validate(updateAssignmentSchema), allowRoles("SUPER_ADMIN"), AssignmentController.updateAssignment)

assignmentRouter.delete('/deleteAssignment/:id', allowRoles("SUPER_ADMIN"), AssignmentController.deleteAssignment)

export default assignmentRouter
