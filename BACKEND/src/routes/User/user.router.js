import { Router } from "express";
import { requireAuth } from "../../common/middlewares/auth.middleware.js";
import { validate } from "../../common/middlewares/validate.middleware.js";
import { createUserSchema, updateUserSchema } from "../../modules/validators/user.validators.js";
import * as UserController from "../../modules/controllers/user.controller.js";

const userRouter = Router()

userRouter.use(requireAuth)

userRouter.get('/listUsers', UserController.list)
userRouter.post('/createUser', validate(createUserSchema), UserController.createUser)
userRouter.get('/:id', UserController.getOne)
userRouter.put('/updateUser/:id', validate(updateUserSchema), UserController.update)

export default userRouter;