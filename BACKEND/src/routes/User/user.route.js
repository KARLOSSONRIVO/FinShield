import { Router } from "express";
import { validate } from "../../common/middlewares/validate.middleware.js";
import { validateCreateUser, updateUserSchema } from "../../modules/validators/user.validator.js";
import { allowRoles } from "../../common/middlewares/rbac.middleware.js";
import * as UserController from "../../modules/controllers/user.controller.js";

const userRouter = Router()

// Auth and password change enforcement handled in index.js

userRouter.get('/listUsers', allowRoles("SUPER_ADMIN"), UserController.list)

userRouter.post('/createUser', validateCreateUser, allowRoles("SUPER_ADMIN", "COMPANY_MANAGER"), UserController.createUser)

userRouter.get('/:id', allowRoles("SUPER_ADMIN", "COMPANY_MANAGER"), UserController.getOne)

userRouter.put('/updateUser/:id', validate(updateUserSchema), allowRoles("SUPER_ADMIN"), UserController.update)

export default userRouter