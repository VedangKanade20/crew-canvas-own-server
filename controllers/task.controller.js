import Task from "../models/task.model.js";
import Teamspace from "../models/teamSpace.model.js";
import User from "../models/user.model.js";

const createTask = async (req, res) => {
    try {
        const { taskName, taskDescription = "", taskAssignedTo } = req.body;

        const taskAssignedBy = req.user.id;

        const { teamspaceId } = req.params;
        if (!teamspaceId) {
            return res.status(404).json({ message: "Teamspace not found" });
        }
        const currentTeamspace = await Teamspace.findById(teamspaceId);
        if (!currentTeamspace) {
            return res.status(404).json({ message: "Teamspace not found" });
        }
        const isMember = currentTeamspace.members.find(
            (member) => member.user.toString() === taskAssignedBy
        );
        if (!isMember || isMember.role !== "admin") {
            return res
                .status(401)
                .json({ message: "current user is not an admin of teamspace" });
        }

        // Scope the duplicate task check to the current teamspace
        const taskExists = await Task.findOne({ taskName, teamspaceId });
        if (taskExists) {
            return res
                .status(400)
                .json({ message: "Task with the same name already exists in this teamspace" });
        }

        let assignedUserId = undefined;
        if (taskAssignedTo) {
            if (!/^[0-9a-fA-F]{24}$/.test(taskAssignedTo)) {
                // Search by email if it doesn't look like an ObjectId
                const assignedUser = await User.findOne({ email: taskAssignedTo });
                if (!assignedUser) {
                    return res.status(404).json({ message: "Assigned user not found by email" });
                }
                assignedUserId = assignedUser._id;
            } else {
                // If it is a valid ObjectId format, verify user exists
                const assignedUser = await User.findById(taskAssignedTo);
                if (!assignedUser) {
                    return res.status(404).json({ message: "Assigned user not found by ID" });
                }
                assignedUserId = assignedUser._id;
            }
        }

        const task = new Task({
            taskName,
            taskDescription,
            taskAssignedTo: assignedUserId,
            taskAssignedBy,
            teamspaceId,
        });

        await task.save();

        // Add task to teamspace's tasks array
        await Teamspace.findByIdAndUpdate(teamspaceId, {
            $push: { tasks: task._id },
        });
        res.status(201).json({ message: "Task Created successfully", task });
    } catch (error) {
        console.error("CreateTask Error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
}; // checked

const getTask = async (req, res) => {
    try {
        const { teamspaceId, taskId } = req.params;

        const userId = req.user.id;

        if (!teamspaceId || !taskId || !userId) {
            return res.status(404).json({
                message: "Teamspace ID or Task ID or userId not provided",
            });
        }

        const teamspace = await Teamspace.findById(teamspaceId);
        if (!teamspace) {
            return res.status(404).json({ message: "Teamspace not found" });
        }
        const isMember = teamspace.members.find(
            (member) => member.user.toString() === userId
        );
        if (!isMember || isMember.role !== "admin") {
            return res
                .status(401)
                .json({ message: "current user is not an admin of teamspace" });
        }
        const task = await Task.findOne({
            _id: taskId,
            teamspaceId: teamspaceId,
        });

        if (!task) {
            return res
                .status(404)
                .json({ message: "Task not found in this teamspace" });
        }

        res.status(200).json({ task });
    } catch (error) {
        console.error("GetTask Error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
}; // checked

const getTasksFromTeamspace = async (req, res) => {
    try {
        const { teamspaceId } = req.params;
        const userId = req.user.id;
        if (!teamspaceId || !userId) {
            return res.status(404).json({ message: "something is missing " });
        }
        const teamspace = await Teamspace.findById(teamspaceId).populate("tasks");
        if (!teamspace) {
            return res.status(404).json({ message: "teamspace not found " });
        }
        const isMember = teamspace.members.find(
            (member) => member.user.toString() === userId
        );
        if (!isMember || isMember.role !== "admin") {
            return res
                .status(401)
                .json({ message: "current user is not an admin of teamspace" });
        }

        res.status(200).json({ tasks: teamspace.tasks });
    } catch (error) {
        console.error("GetTasksFromTeamspace Error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
}; // checked

const updateTask = async (req, res) => {
    try {
        const { teamspaceId, taskId } = req.params;
        const { taskName, taskDescription } = req.body;
        const userId = req.user.id;
        if (!teamspaceId || !taskId || !userId) {
            return res.status(404).json({
                message: "Teamspace ID or Task ID or User ID not provided",
            });
        }

        const teamspace = await Teamspace.findById(teamspaceId);
        if (!teamspace) {
            return res.status(404).json({ message: "Teamspace not found" });
        }
        const isMember = teamspace.members.find(
            (member) => member.user.toString() === userId
        );
        if (!isMember || isMember.role !== "admin") {
            return res
                .status(401)
                .json({ message: "current user is not an admin of teamspace" });
        }

        if (!taskName || !taskDescription) {
            return res
                .status(400)
                .json({ message: "Task name and description are required" });
        }

        const task = await Task.findOneAndUpdate(
            {
                _id: taskId,
                teamspaceId: teamspaceId,
                taskAssignedBy: userId,
            },
            { taskName, taskDescription },
            { new: true }
        );

        if (!task) {
            return res
                .status(404)
                .json({ message: "Task not found in this teamspace" });
        }

        res.status(200).json({ message: "Task Updated Successfully", task });
    } catch (error) {
        console.error("UpdateTask Error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
}; // checked

const deleteTask = async (req, res) => {
    try {
        const { teamspaceId, taskId } = req.params;
        const userId = req.user.id;

        if (!teamspaceId || !taskId || !userId) {
            return res.status(404).json({
                message: "Teamspace ID or Task ID or user ID not provided",
            });
        }

        const teamspace = await Teamspace.findById(teamspaceId);
        if (!teamspace) {
            return res.status(404).json({ message: "Teamspace not found" });
        }
        const isMember = teamspace.members.find(
            (member) => member.user.toString() === userId
        );
        if (!isMember || isMember.role !== "admin") {
            return res
                .status(401)
                .json({ message: "current user is not an admin of teamspace" });
        }

        const deletedTask = await Task.findOneAndDelete({
            _id: taskId,
            teamspaceId: teamspaceId,
        });

        if (!deletedTask) {
            return res
                .status(404)
                .json({ message: "Task not found in this teamspace" });
        }

        // Remove task reference from teamspace
        await Teamspace.findByIdAndUpdate(teamspaceId, {
            $pull: { tasks: taskId },
        });

        res.status(200).json({
            message: "Task successfully deleted",
            deletedTask,
        });
    } catch (error) {
        console.error("DeleteTask Error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
}; // checked

const toggleTaskStatus = async (req, res) => {
    try {
        const { teamspaceId, taskId } = req.params;

        if (!teamspaceId || !taskId) {
            return res
                .status(404)
                .json({ message: "Teamspace ID or Task ID not provided" });
        }

        const teamspace = await Teamspace.findById(teamspaceId);
        if (!teamspace) {
            return res.status(404).json({ message: "Teamspace not found" });
        }

        const isMember = teamspace.members.some(
            (member) => member.user.toString() === req.user.id
        );
        if (!isMember) {
            return res
                .status(401)
                .json({ message: "you're not a part to this teamspace" });
        }

        const task = await Task.findOne({ _id: taskId, teamspaceId });
        if (!task) {
            return res
                .status(404)
                .json({ message: "Task not found in this teamspace" });
        }

        const newStatus = task.taskStatus === "Pending" ? "Completed" : "Pending";
        const updatedTask = await Task.findByIdAndUpdate(
            taskId,
            { taskStatus: newStatus },
            { new: true }
        );

        res.status(200).json({
            message: "Task status updated successfully",
            task: updatedTask,
        });
    } catch (error) {
        console.error("ToggleTaskStatus Error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
}; // checked

export {
    createTask,
    getTask,
    updateTask,
    deleteTask,
    getTasksFromTeamspace,
    toggleTaskStatus,
};
