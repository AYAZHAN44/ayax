const router = require("express").Router();
const controller = require("../controllers/doctorController");
const { requireAuth, allowRoles } = require("../middleware/auth");

router.get("/", controller.listDoctors);
router.get("/:id", controller.getDoctor);
router.post("/", requireAuth, allowRoles("admin"), controller.createDoctor);
router.patch("/:id", requireAuth, allowRoles("admin"), controller.updateDoctor);
router.delete("/:id", requireAuth, allowRoles("admin"), controller.deleteDoctor);

module.exports = router;
