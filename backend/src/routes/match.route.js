import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import { getPotentialMatches, createMatch, getMatches } from "../controllers/match.controller.js";

const router = express.Router();

router.get("/potential", protectRoute, getPotentialMatches);
router.post("/like", protectRoute, createMatch);
router.get("/", protectRoute, getMatches);

export default router;
