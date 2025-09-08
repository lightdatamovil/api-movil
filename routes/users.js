import { Router } from 'express';
import { buildHandler } from './_handler.js';
import { editUser } from '../controller/user/edit_user.js';
import { changePassword } from '../controller/user/change_password.js';
import { changeProfilePicture } from '../controller/user/change_profile_picture.js';

const users = Router();

users.post(
    '/edit-user',
    buildHandler({
        required: ['email', 'phone'],
        controller: async ({ db, req }) => {
            const result = await editUser(db, req);
            return result;
        },
    })
);

users.post(
    '/change-password',
    buildHandler({
        required: ['oldPassword', 'newPassword'],
        controller: async ({ db, req }) => {
            const result = await changePassword(db, req);
            return result;
        },
    })
);

users.post(
    '/change-profile-picture',
    buildHandler({
        needsDb: false,
        required: ['image'],
        controller: async ({ req, company }) => {
            const result = await changeProfilePicture(req, company);
            return result;
        },
    })
);

export default users;
