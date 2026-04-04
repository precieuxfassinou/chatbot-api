import { useState, useEffect } from "react";
import apiFetch from "../api";
import API_URL from "../config";

export default function Dashboard() {
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalConversations: 0,
    todayMessages: 0,
  });
  const [topIntentions, setTopIntentions] = useState([]);

  useEffect(() => {
    const loadData = async () => {
      const [usersData, statsData, topIntentionsData] = await Promise.all([
        apiFetch(`${API_URL}/admin/users`).then((res) => res.json()),
        apiFetch(`${API_URL}/admin/stats`).then((res) => res.json()),
        apiFetch(`${API_URL}/admin/top-intentions`).then((res) => res.json()),
      ]);
      setUsers(usersData || []);
      setTopIntentions(topIntentionsData || []);
      setStats(
        statsData || { totalUsers: 0, totalConversations: 0, todayMessages: 0 },
      );
    };
    loadData();
  }, []);

  const deleteUser = async (userId) => {
    if (window.confirm("Supprimer cet utilisateur ?")) {
      await apiFetch(`${API_URL}/admin/users/${userId}`, {
        method: "DELETE",
      });
      setUsers(users.filter((u) => u.id !== userId));
    }
  };

  return (
    <div className="dashboard-container">
      <h1>Dashboard Admin</h1>

      {/* Stats */}
      <div className="stats-grid">
        <div className="stat-card">Utilisateurs : {stats.totalUsers}</div>
        <div className="stat-card">
          Conversations : {stats.totalConversations}
        </div>
        <div className="stat-card">
          Messages aujourd'hui : {stats.todayMessages}
        </div>
      </div>

      {/* Utilisateurs */}
      <h2>Utilisateurs</h2>
      <h2>Utilisateurs</h2>
      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Nom</th>
              <th>Email</th>
              <th>Rôle</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td>
                  {user.firstname} {user.lastname}
                </td>
                <td>{user.email}</td>
                <td>{user.role}</td>
                <td>
                  {user.role !== "admin" && (
                    <button onClick={() => deleteUser(user.id)}>
                      Supprimer
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Top intentions */}
      <h2>Top Intentions</h2>
      <div className="intentions-list">
        {topIntentions.map((item, index) => (
          <div key={index} className="intention-item">
            <span>{item.intention}</span>
            <span>{item.count} messages</span>
          </div>
        ))}
      </div>
    </div>
  );
}
