import Comment from "../models/Comment.js";

export const addComment = async (req, res) => {
    try {
        const { task_id, user_id, comment_text } = req.body;
        const comment = await Comment.create({ task_id, user_id, comment_text });
        res.status(201).json(comment);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const getComments = async (req, res) => {
    try {
        const { task_id } = req.params;
        const comments = await Comment.findAll({ where: { task_id } });
        res.json(comments);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const deleteComment = async (req, res) => {
    try {
        const { id } = req.params;
        const deleted = await Comment.destroy({ where: { id } });
        if (!deleted) return res.status(404).json({ error: "Comment not found" });
        res.json({ message: "Comment deleted successfully" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
