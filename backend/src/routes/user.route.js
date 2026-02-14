import { Router } from "express";
import {
  userRegister,
  userLogin,
  userLogout,
  refreshAccessToken,
  getCurrentUser,
} from "../controller/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.post("/register", upload.single("profileImage"), userRegister);
router.post("/login", userLogin);
router.post("/logout", verifyJWT, userLogout);
router.post("/refresh-token", refreshAccessToken);
router.get("/me", verifyJWT, getCurrentUser);

export default router;
