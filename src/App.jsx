import React, { useState, createContext, useContext, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, useNavigate, useParams, Navigate } from 'react-router-dom';
import './App.css';

const TaskContext = createContext();

export function TaskProvider({ children }) {
  const [tasks, setTasks] = useState([
    {
      id: '1',
      header: 'Complete React Lab Report',
      description: 'Write down convex lens focal length experiment details.',
      priority: 'High',
      category: 'Academic',
      raisedDate: '2026-09-28 04:30 PM',
      dueDate: '2026-10-05',
      status: 'Pending',
    },
    {
      id: '2',
      header: 'Grocery Shopping',
      description: 'Buy milk, eggs, fruits, and vegetables from local market.',
      priority: 'Medium',
      category: 'Personal',
      raisedDate: '2026-09-28 05:00 PM',
      dueDate: '2026-10-02',
      status: 'Raised',
    },
  ]);

  // Authentication State with LocalStorage & Simulated JWT
  const [auth, setAuth] = useState(() => {
    const savedUser = localStorage.getItem('user');
    const savedToken = localStorage.getItem('jwt_token');
    return savedUser ? { isAuthenticated: true, user: JSON.parse(savedUser), token: savedToken } : { isAuthenticated: false, user: null, token: null };
  });

  const login = (username, remember) => {
    const fakeToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.simulated_token_' + Date.now();
    const userData = { username };
    setAuth({ isAuthenticated: true, user: userData, token: fakeToken });
    
    if (remember) {
      localStorage.setItem('user', JSON.stringify(userData));
      localStorage.setItem('jwt_token', fakeToken);
    }
  };

  const logout = () => {
    setAuth({ isAuthenticated: false, user: null, token: null });
    localStorage.removeItem('user');
    localStorage.removeItem('jwt_token');
  };

  const addTask = (task) => {
    setTasks([...tasks, { ...task, id: Date.now().toString(), raisedDate: new Date().toLocaleString(), status: 'Raised' }]);
  };

  const updateTaskStatus = (id, newStatus) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, status: newStatus } : t));
  };

  const deleteTask = (id) => {
    setTasks(tasks.filter(t => t.id !== id));
  };

  return (
    <TaskContext.Provider value={{ tasks, addTask, updateTaskStatus, deleteTask, auth, login, logout }}>
      {children}
    </TaskContext.Provider>
  );
}

export const useTasks = () => useContext(TaskContext);

function ProtectedRoute({ children }) {
  const { auth } = useTasks();
  return auth.isAuthenticated ? children : <Navigate to="/login" replace />;
}

function Navbar() {
  const { auth, logout } = useTasks();
  const navigate = useNavigate();

  return (
    <nav className="navbar">
      <h2>Task Manager App</h2>
      {auth.isAuthenticated && (
        <div className="nav-links">
          <Link to="/dashboard">Dashboard</Link>
          <Link to="/tasks">All Tasks</Link>
          <Link to="/add-task">Add Task</Link>
          <Link to="/completed">Completed</Link>
          <button onClick={() => { logout(); navigate('/login'); }} className="btn-logout">Logout</button>
        </div>
      )}
    </nav>
  );
}

function Login() {
  const { login } = useTasks();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState('');

  // Password Strength Logic
  const getPasswordStrength = (pass) => {
    if (!pass) return { text: '', color: '' };
    if (pass.length < 6) return { text: 'Weak', color: '#ef4444' };
    if (pass.match(/[A-Z]/) && pass.match(/[0-9]/) && pass.length >= 8) return { text: 'Strong', color: '#22c55e' };
    return { text: 'Medium', color: '#f59e0b' };
  };

  const strength = getPasswordStrength(password);

  const handleLogin = (e) => {
    e.preventDefault();
    if (!username.trim()) {
      setError('Username is required[span_2](start_span)[span_2](end_span)!');
      return;
    }
    if (!password) {
      setError('Password is required[span_3](start_span)[span_3](end_span)!');
      return;
    }
    setError('');
    login(username, remember);
    navigate('/dashboard');
  };

  return (
    <div className="login-container">
      <form onSubmit={handleLogin} className="login-card">
        <h2>Sign In</h2>
        {error && <p className="error-msg">{error}</p>}
        <div className="input-group">
          <label>Username</label>
          <input
            type="text"
            placeholder="Enter username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
        </div>
        <div className="input-group">
          <label>Password</label>
          <input
            type="password"
            placeholder="Enter password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {password && (
            <p className="strength-indicator" style={{ color: strength.color }}>
              Strength: <span>{strength.text}</span>
            </p>
          )}
        </div>
        <div className="remember-group">
          <label>
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
            />{' '}
            Remember User[span_4](start_span)[span_4](end_span)
          </label>
        </div>
        <button type="submit" className="btn-submit">Login[span_5](start_span)[span_5](end_span)</button>
      </form>
    </div>
  );
}

function Dashboard() {
  const { tasks, auth } = useTasks();
  const total = tasks.length;
  const completed = tasks.filter(t => t.status === 'Closed').length;
  const pending = tasks.filter(t => t.status === 'Pending' || t.status === 'Raised').length;

  return (
    <div className="page">
      <h1>Welcome, {auth.user?.username || 'User'}!</h1>
      <p className="token-info"><strong>Simulated JWT Token:</strong> {auth.token?.substring(0, 30)}...</p>
      <div className="stats-grid">
        <div className="stat-card">
          <h3>Total Tasks</h3>
          <p>{total}</p>
        </div>
        <div className="stat-card">
          <h3>Pending / Active</h3>
          <p>{pending}</p>
        </div>
        <div className="stat-card">
          <h3>Completed</h3>
          <p>{completed}</p>
        </div>
      </div>
    </div>
  );
}

function TasksList() {
  const { tasks, updateTaskStatus, deleteTask } = useTasks();
  const [filter, setFilter] = useState('All');

  const filteredTasks = tasks.filter(t => {
    if (filter === 'All') return true;
    return t.category === filter;
  });

  return (
    <div className="page">
      <div className="header-flex">
        <h1>All Tasks</h1>
        <div className="filter-buttons">
          <button onClick={() => setFilter('All')} className={filter === 'All' ? 'active' : ''}>All</button>
          <button onClick={() => setFilter('Academic')} className={filter === 'Academic' ? 'active' : ''}>Academic</button>
          <button onClick={() => setFilter('Personal')} className={filter === 'Personal' ? 'active' : ''}>Personal</button>
        </div>
      </div>

      <div className="task-grid">
        {filteredTasks.map(task => (
          <div key={task.id} className="task-card">
            <h3>{task.header}</h3>
            <p className="desc">{task.description}</p>
            <div className="badges">
              <span className={`priority ${task.priority.toLowerCase()}`}>{task.priority}</span>
              <span className="category">{task.category}</span>
              <span className={`status ${task.status.toLowerCase()}`}>{task.status}</span>
            </div>
            <p className="date-info">Due: {task.dueDate}</p>
            <div className="card-actions">
              <Link to={`/task/${task.id}`} className="btn-view">View Details</Link>
              {task.status !== 'Closed' && (
                <button onClick={() => updateTaskStatus(task.id, 'Closed')} className="btn-complete">Mark Complete</button>
              )}
              <button onClick={() => deleteTask(task.id)} className="btn-delete">Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AddTask() {
  const { addTask } = useTasks();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    header: '',
    description: '',
    priority: 'Medium',
    category: 'Academic',
    dueDate: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.header || !form.dueDate) return alert('Please fill required fields');
    addTask(form);
    navigate('/tasks');
  };

  return (
    <div className="page form-page">
      <h1>Add New Task</h1>
      <form onSubmit={handleSubmit} className="task-form">
        <input
          type="text"
          placeholder="Task Header"
          value={form.header}
          onChange={e => setForm({ ...form, header: e.target.value })}
        />
        <textarea
          placeholder="Task Description"
          value={form.description}
          onChange={e => setForm({ ...form, description: e.target.value })}
        />
        <div className="row-fields">
          <label>
            Priority:
            <select value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </label>
          <label>
            Category:
            <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
              <option value="Academic">Academic</option>
              <option value="Personal">Personal</option>
            </select>
          </label>
        </div>
        <label>
          Due Date:
          <input
            type="date"
            value={form.dueDate}
            onChange={e => setForm({ ...form, dueDate: e.target.value })}
          />
        </label>
        <button type="submit" className="btn-submit">Create Task</button>
      </form>
    </div>
  );
}

function TaskDetails() {
  const { id } = useParams();
  const { tasks } = useTasks();
  const task = tasks.find(t => t.id === id);

  if (!task) return <div className="page"><h2>Task not found!</h2></div>;

  return (
    <div className="page">
      <div className="details-card">
        <h1>{task.header}</h1>
        <p className="full-desc">{task.description}</p>
        <div className="details-info">
          <p><strong>Priority:</strong> {task.priority}</p>
          <p><strong>Category:</strong> {task.category}</p>
          <p><strong>Status:</strong> {task.status}</p>
          <p><strong>Raised Date & Time:</strong> {task.raisedDate}</p>
          <p><strong>Due Date:</strong> {task.dueDate}</p>
        </div>
        <Link to="/tasks" className="btn-view">Back to Tasks</Link>
      </div>
    </div>
  );
}

function CompletedTasks() {
  const { tasks } = useTasks();
  const completedTasks = tasks.filter(t => t.status === 'Closed');

  return (
    <div className="page">
      <h1>Completed Tasks</h1>
      {completedTasks.length === 0 ? (
        <p className="empty-text">No completed tasks yet.</p>
      ) : (
        <div className="task-grid">
          {completedTasks.map(task => (
            <div key={task.id} className="task-card completed">
              <h3>{task.header}</h3>
              <p className="desc">{task.description}</p>
              <span className="status closed">Closed</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <TaskProvider>
      <BrowserRouter>
        <Navbar />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/tasks" element={<ProtectedRoute><TasksList /></ProtectedRoute>} />
          <Route path="/add-task" element={<ProtectedRoute><AddTask /></ProtectedRoute>} />
          <Route path="/task/:id" element={<ProtectedRoute><TaskDetails /></ProtectedRoute>} />
          <Route path="/completed" element={<ProtectedRoute><CompletedTasks /></ProtectedRoute>} />
        </Routes>
      </BrowserRouter>
    </TaskProvider>
  );
}