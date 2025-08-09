import express from 'express';
import { loginController } from '../controllers/loginController.js';
import { signupController } from '../controllers/signupController.js';
import { guestSignupController } from '../controllers/guesSignupController.js';
import jwtVerifyController from '../controllers/jwtVerifyController.js';
import adminLoginController from '../controllers/adminLoginController.js';
import { updatePersonalDetails } from '../controllers/updateInfoController.js';
import { verifyAuthMiddleware } from '../middlewares/verifyAuth.js';
import { deleteAllMessages } from '../controllers/deleteChatController.js';
import { getMessageCount } from '../controllers/msgCountController.js';
import { chatbotController } from '../controllers/chatbot.js';

const router = express.Router();

router.post('/login', loginController);
router.post('/signup', signupController);
router.post('/signup-guest', guestSignupController);
router.put('/update-info', verifyAuthMiddleware, updatePersonalDetails);
router.put('/delete-chat', verifyAuthMiddleware, deleteAllMessages);
router.get('/msg-count', verifyAuthMiddleware, getMessageCount);
router.post('/chatbot-resp', chatbotController);
router.post('/jwtverify', jwtVerifyController);
router.post('/adminlogin', adminLoginController);

export default router;
