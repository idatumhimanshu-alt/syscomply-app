import React, { useEffect, useState } from "react";
import "../../styles/AssignedTaskspage.css";
import axiosInstance from "../../services/axiosinstance";

const AssignedTasksPage = () => {
  const [tasks, setTasks] = useState([]);
  const [taskId, setTaskId] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    axiosInstance.get("/tasks")
      .then((res) => res.data.length && setTaskId(res.data[0].id))
      .catch(() => setError("Failed to load tasks."));
  }, []);

  useEffect(() => {
    if (taskId) {
      axiosInstance.get(`/task-assignments/task/${taskId}`)
        .then((res) => setTasks(res.data))
        .catch(() => setError("Failed to load assigned tasks."));
    }
  }, [taskId]);

  if (error) return <p className="error">{error}</p>;

  return (
    <div className="container">
      <h2>Assigned Users for Task</h2>
      <table>
        <thead>
          <tr>
            <th>User Name</th>
            <th>Role</th>
            <th>Email</th>
          </tr>
        </thead>
        <tbody>
          {tasks.length ? tasks.map(({ userId, userName, role, email }) => (
            <tr key={userId}>
              <td>{userName}</td>
              <td>{role}</td>
              <td>{email}</td>
            </tr>
          )) : (
            <tr>
              <td colSpan="3">No users assigned.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default AssignedTasksPage;
