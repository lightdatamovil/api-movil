import { Router } from 'express';
import { editUser } from '../controller/user/edit_user.js';
import { changePassword } from '../controller/user/change_password.js';
import { changeProfilePicture } from '../controller/user/change_profile_picture.js';
import { buildHandlerWrapper } from '../src/functions/build_handler_wrapper.js';

const users = Router();

users.post(
    '/edit-user',
    buildHandlerWrapper({
        required: ['email', 'phone'],
        controller: async ({ db, req }) => await editUser({ db, req }),
    })
);

users.post(
    '/change-password',
    buildHandlerWrapper({
        required: ['oldPassword', 'newPassword'],
        controller: async ({ db, req }) => await changePassword({ db, req }),
    })
);

users.post(
    '/change-profile-picture',
    buildHandlerWrapper({
        needsDb: false,
        required: ['image'],
        controller: async ({ req, company }) => await changeProfilePicture({ req, company }),
    })
);

export default users;
