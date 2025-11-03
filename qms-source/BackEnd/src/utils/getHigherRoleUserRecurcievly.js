import User from "../models/User.js";

export const getAllReportToUsers = async (userId, visited = new Set()) => {
    if (visited.has(userId)) return [];
    visited.add(userId);

    const user = await User.findByPk(userId);
    if (!user || !user.reportTo) return [];

    const managerId = user.reportTo;
    const higherUps = await getAllReportToUsers(managerId, visited);

    return [managerId, ...higherUps];
};
