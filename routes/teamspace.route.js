import { Router } from "express";

import {
    createTeamspace,
    getTeamspace,
    addMember,
    removeMember,
    deleteTeamspace,
    getAllTeamspaces,
} from "../controllers/teamspace.controller.js";

import { verifyJWT } from "../middlewares/user.middleware.js";

const teamspaceRouter = Router();

teamspaceRouter.use(verifyJWT);
// routes
teamspaceRouter.get("/get-allTeamspaces", getAllTeamspaces);

teamspaceRouter.post("/create-teamspace", createTeamspace);

teamspaceRouter.get("/getTeamspace/:teamspaceId", getTeamspace);

teamspaceRouter.put("/:teamspaceId/add-member", addMember);

teamspaceRouter.put("/:teamspaceId/remove-member", removeMember);

teamspaceRouter.delete("/delete-teamspace/:teamspaceId", deleteTeamspace);

export default teamspaceRouter;
