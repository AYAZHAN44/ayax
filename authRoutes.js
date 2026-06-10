const router = require("express").Router();
const controller = require("../controllers/authController");
const { requireAuth } = require("../middleware/auth");

router.post("/register", controller.registerClient);
router.post("/login", controller.login);
router.get("/me", requireAuth, controller.me);

module.exports = router;
