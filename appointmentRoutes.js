const router = require("express").Router();
const controller = require("../controllers/appointmentController");
const { requireAuth } = require("../middleware/auth");

router.get("/", requireAuth, controller.listAppointments);
router.get("/slots", controller.availableSlots);
router.post("/", requireAuth, controller.createAppointment);
router.patch("/:id/status", requireAuth, controller.updateAppointmentStatus);

module.exports = router;
