import { Router, type IRouter } from "express";
import healthRouter from "./health";
import guestsRouter from "./guests";
import invitationRouter from "./invitation";
import configRouter from "./config";
import statsRouter from "./stats";
import adminRouter from "./admin";

const router: IRouter = Router();

router.use(healthRouter);
router.use(guestsRouter);
router.use(invitationRouter);
router.use(configRouter);
router.use(statsRouter);
router.use(adminRouter);

export default router;
