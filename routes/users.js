import { Router } from 'express';
import { editUser } from '../controller/user/edit_user.js';
import { changePassword } from '../controller/user/change_password.js';
import { changeProfilePicture } from '../controller/user/change_profile_picture.js';
import { buildHandlerWrapper } from '../src/funciones/build_handler_wrapper.js';

const users = Router();

users.post(
    '/edit-user',
    buildHandlerWrapper({
        required: ['email', 'phone'],
        controller: async ({ db, req }) => {
            const result = await editUser(db, req);
            return result;
        },
    })
);

users.post(
    '/change-password',
    buildHandlerWrapper({
        required: ['oldPassword', 'newPassword'],
        controller: async ({ db, req }) => {
            const result = await changePassword(db, req);
            return result;
        },
    })
);

users.post(
    '/change-profile-picture',
    buildHandlerWrapper({
        needsDb: false,
        required: ['image'],
        controller: async ({ req, company }) => {
            const result = await changeProfilePicture(req, company);
            return result;
        },
    })
);

export default users;
