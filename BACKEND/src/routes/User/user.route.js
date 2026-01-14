import { Router } from "express";
import { validate } from "../../common/middlewares/validate.middleware.js";
import { validateCreateUser, updateUserSchema } from "../../modules/validators/user.validator.js";
import { allowRoles } from "../../common/middlewares/rbac.middleware.js";
import * as UserController from "../../modules/controllers/user.controller.js";

const userRouter = Router()

// Auth and password change enforcement handled in index.js

// Only SUPER_ADMIN can list all users (service enforces this)
userRouter.get('/listUsers', allowRoles("SUPER_ADMIN"), UserController.list)

// SUPER_ADMIN and COMPANY_MANAGER can create users
// validateCreateUser ensures COMPANY_MANAGER can only create COMPANY_USER (rejects AUDITOR, REGULATOR, etc.)
userRouter.post('/createUser', validateCreateUser, allowRoles("SUPER_ADMIN", "COMPANY_MANAGER"), UserController.createUser)

// SUPER_ADMIN can access any user, others can only access users in their org (service enforces this)
userRouter.get('/:id', allowRoles("SUPER_ADMIN", "COMPANY_MANAGER"), UserController.getOne)

// Only SUPER_ADMIN can update user status (service enforces this)
userRouter.put('/updateUser/:id', validate(updateUserSchema), allowRoles("SUPER_ADMIN"), UserController.update)

export default userRouter