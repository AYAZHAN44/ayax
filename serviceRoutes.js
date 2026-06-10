const router = require("express").Router();
const controller = require("../controllers/serviceController");
const { requireAuth, allowRoles } = require("../middleware/auth");

router.get("/", controller.listServices);
router.post("/", requireAuth, allowRoles("admin"), controller.createService);

module.exports = router;
