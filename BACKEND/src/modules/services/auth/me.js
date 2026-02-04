import AppError from "../../../common/errors/AppErrors.js";
import * as UsersRepository from "../../repositories/user.repositories.js";
import { toUserPublic } from "../../mappers/user.mapper.js";

export async function me({ actor }) {
    const user = await UsersRepository.findById(actor.sub);
    if (!user) throw new AppError("User not found", 404, "USER_NOT_FOUND");
    return toUserPublic(user);
}
