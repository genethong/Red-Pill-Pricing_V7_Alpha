import { SiteInputs } from '../types';
import { TEMPLATES } from '../templates';

export interface User {
  username: string;
  role: 'admin' | 'user';
  createdAt: string;
}

export interface SavedProject {
  id: string;
  username: string;
  name: string;
  data: SiteInputs;
  updatedAt: string;
}

export interface SavedTemplate {
  id: string;
  username: string;
  name: string;
  data: SiteInputs;
  createdAt: string;
}

// Simple and highly robust hashing helper (FNV-1a based custom string hash with hex conversion for simplicity and synchronous ease)
function hashPassword(password: string): string {
  let hash = 2166136261;
  for (let i = 0; i < password.length; i++) {
    hash ^= password.charCodeAt(i);
    hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
  }
  return (hash >>> 0).toString(16);
}

const USERS_KEY = 'redpill_users_db';
const PROJECTS_KEY = 'redpill_projects_db';
const TEMPLATES_KEY = 'redpill_templates_db';
const SYSTEM_TEMPLATES_KEY = 'redpill_system_templates';

// Helper to initialize local databases with default accounts
export function initDB() {
  if (!localStorage.getItem(USERS_KEY)) {
    const defaultUsers = {
      'admin': {
        username: 'admin',
        passwordHash: hashPassword('admin123'),
        role: 'admin',
        createdAt: new Date().toISOString()
      },
      'engineer': {
        username: 'engineer',
        passwordHash: hashPassword('eng123'),
        role: 'user',
        createdAt: new Date().toISOString()
      }
    };
    localStorage.setItem(USERS_KEY, JSON.stringify(defaultUsers));
  }

  if (!localStorage.getItem(PROJECTS_KEY)) {
    localStorage.setItem(PROJECTS_KEY, JSON.stringify([]));
  }

  if (!localStorage.getItem(TEMPLATES_KEY)) {
    localStorage.setItem(TEMPLATES_KEY, JSON.stringify([]));
  }

  if (!localStorage.getItem(SYSTEM_TEMPLATES_KEY)) {
    localStorage.setItem(SYSTEM_TEMPLATES_KEY, JSON.stringify(TEMPLATES));
  }
}

// Get the authenticated user from storage
export function getSavedSession(): User | null {
  const session = localStorage.getItem('redpill_current_session');
  return session ? JSON.parse(session) : null;
}

// System dynamic template operations for all users
export function getSystemTemplates(): { name: string; data: SiteInputs }[] {
  initDB();
  const raw = localStorage.getItem(SYSTEM_TEMPLATES_KEY);
  if (!raw) {
    localStorage.setItem(SYSTEM_TEMPLATES_KEY, JSON.stringify(TEMPLATES));
    return TEMPLATES;
  }
  return JSON.parse(raw);
}

export function saveSystemTemplate(name: string, data: SiteInputs): void {
  initDB();
  const templates = getSystemTemplates();
  const existingIndex = templates.findIndex(t => t.name.toLowerCase() === name.trim().toLowerCase());
  if (existingIndex >= 0) {
    templates[existingIndex].data = data;
  } else {
    templates.push({ name: name.trim(), data });
  }
  localStorage.setItem(SYSTEM_TEMPLATES_KEY, JSON.stringify(templates));
}

export function deleteSystemTemplate(name: string): void {
  initDB();
  const templates = getSystemTemplates();
  const filtered = templates.filter(t => t.name.toLowerCase() !== name.toLowerCase());
  localStorage.setItem(SYSTEM_TEMPLATES_KEY, JSON.stringify(filtered));
}

export function saveAllSystemTemplates(templates: { name: string; data: SiteInputs }[]): void {
  initDB();
  localStorage.setItem(SYSTEM_TEMPLATES_KEY, JSON.stringify(templates));
}

export function saveSession(user: User) {
  localStorage.setItem('redpill_current_session', JSON.stringify(user));
}

export function clearSession() {
  localStorage.removeItem('redpill_current_session');
}

// Auth operations
export function loginUser(username: string, passwordHashInput: string): User | null {
  initDB();
  const rawUsers = localStorage.getItem(USERS_KEY);
  if (!rawUsers) return null;

  const users = JSON.parse(rawUsers);
  const normalizedUsername = username.trim().toLowerCase();
  const user = users[normalizedUsername];

  if (user && user.passwordHash === hashPassword(passwordHashInput)) {
    const sessionUser: User = {
      username: user.username,
      role: user.role,
      createdAt: user.createdAt
    };
    saveSession(sessionUser);
    return sessionUser;
  }
  return null;
}

// Admin operations
export function getAllUsers(): User[] {
  initDB();
  const rawUsers = localStorage.getItem(USERS_KEY);
  if (!rawUsers) return [];

  const users = JSON.parse(rawUsers);
  return Object.values(users).map((u: any) => ({
    username: u.username,
    role: u.role,
    createdAt: u.createdAt
  }));
}

export function addUser(username: string, passwordRaw: string, role: 'admin' | 'user'): { success: boolean; message: string } {
  initDB();
  const normalizedUsername = username.trim().toLowerCase();
  
  if (!normalizedUsername) {
    return { success: false, message: 'Username cannot be empty.' };
  }
  if (passwordRaw.length < 4) {
    return { success: false, message: 'Password must be at least 4 characters long.' };
  }

  const rawUsers = localStorage.getItem(USERS_KEY);
  if (!rawUsers) return { success: false, message: 'Database error.' };

  const users = JSON.parse(rawUsers);
  if (users[normalizedUsername]) {
    return { success: false, message: `Username "${normalizedUsername}" already exists.` };
  }

  users[normalizedUsername] = {
    username: normalizedUsername,
    passwordHash: hashPassword(passwordRaw),
    role,
    createdAt: new Date().toISOString()
  };

  localStorage.setItem(USERS_KEY, JSON.stringify(users));
  return { success: true, message: 'User added successfully!' };
}

export function removeUser(username: string, currentUserVal: string): { success: boolean; message: string } {
  initDB();
  const normalizedUsername = username.trim().toLowerCase();

  if (normalizedUsername === currentUserVal.toLowerCase()) {
    return { success: false, message: 'You cannot remove your own account.' };
  }
  if (normalizedUsername === 'admin') {
    return { success: false, message: 'The primary admin account cannot be removed.' };
  }

  const rawUsers = localStorage.getItem(USERS_KEY);
  if (!rawUsers) return { success: false, message: 'Database error.' };

  const users = JSON.parse(rawUsers);
  if (!users[normalizedUsername]) {
    return { success: false, message: 'User not found.' };
  }

  delete users[normalizedUsername];
  localStorage.setItem(USERS_KEY, JSON.stringify(users));

  // Also clean up that user's projects & templates if desired (or orphan them, purging is safer)
  const rawProjects = localStorage.getItem(PROJECTS_KEY) || '[]';
  const projects = JSON.parse(rawProjects);
  const updatedProjects = projects.filter((p: SavedProject) => p.username.toLowerCase() !== normalizedUsername);
  localStorage.setItem(PROJECTS_KEY, JSON.stringify(updatedProjects));

  const rawTemplates = localStorage.getItem(TEMPLATES_KEY) || '[]';
  const templates = JSON.parse(rawTemplates);
  const updatedTemplates = templates.filter((t: SavedTemplate) => t.username.toLowerCase() !== normalizedUsername);
  localStorage.setItem(TEMPLATES_KEY, JSON.stringify(updatedTemplates));

  return { success: true, message: 'User and all associated data deleted successfully!' };
}

export function resetUserPassword(username: string, newPasswordRaw: string): { success: boolean; message: string } {
  initDB();
  const normalizedUsername = username.trim().toLowerCase();

  if (newPasswordRaw.length < 4) {
    return { success: false, message: 'Password must be at least 4 characters long.' };
  }

  const rawUsers = localStorage.getItem(USERS_KEY);
  if (!rawUsers) return { success: false, message: 'Database error.' };

  const users = JSON.parse(rawUsers);
  if (!users[normalizedUsername]) {
    return { success: false, message: 'User not found.' };
  }

  users[normalizedUsername].passwordHash = hashPassword(newPasswordRaw);
  localStorage.setItem(USERS_KEY, JSON.stringify(users));

  return { success: true, message: `Successfully reset password for user "${username}"!` };
}

// Project database operations
export function getUserProjects(username: string): SavedProject[] {
  initDB();
  const rawProjects = localStorage.getItem(PROJECTS_KEY);
  if (!rawProjects) return [];

  const projects: SavedProject[] = JSON.parse(rawProjects);
  return projects.filter(p => p.username.toLowerCase() === username.toLowerCase());
}

export function saveUserProject(username: string, name: string, data: SiteInputs): SavedProject {
  initDB();
  const rawProjects = localStorage.getItem(PROJECTS_KEY) || '[]';
  const projects: SavedProject[] = JSON.parse(rawProjects);

  const existingIndex = projects.findIndex(p => p.username.toLowerCase() === username.toLowerCase() && p.name.toLowerCase() === name.trim().toLowerCase());

  const newProject: SavedProject = {
    id: existingIndex >= 0 ? projects[existingIndex].id : Math.random().toString(36).substring(2, 11),
    username: username.toLowerCase(),
    name: name.trim(),
    data,
    updatedAt: new Date().toISOString()
  };

  if (existingIndex >= 0) {
    projects[existingIndex] = newProject;
  } else {
    projects.push(newProject);
  }

  localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
  return newProject;
}

export function deleteUserProject(projectId: string): void {
  initDB();
  const rawProjects = localStorage.getItem(PROJECTS_KEY) || '[]';
  const projects: SavedProject[] = JSON.parse(rawProjects);
  const filtered = projects.filter(p => p.id !== projectId);
  localStorage.setItem(PROJECTS_KEY, JSON.stringify(filtered));
}

// Template database operations
export function getUserTemplates(username: string): SavedTemplate[] {
  initDB();
  const rawTemplates = localStorage.getItem(TEMPLATES_KEY);
  if (!rawTemplates) return [];

  const templates: SavedTemplate[] = JSON.parse(rawTemplates);
  return templates.filter(t => t.username.toLowerCase() === username.toLowerCase());
}

export function saveUserTemplate(username: string, name: string, data: SiteInputs): SavedTemplate {
  initDB();
  const rawTemplates = localStorage.getItem(TEMPLATES_KEY) || '[]';
  const templates: SavedTemplate[] = JSON.parse(rawTemplates);

  const existingIndex = templates.findIndex(t => t.username.toLowerCase() === username.toLowerCase() && t.name.toLowerCase() === name.trim().toLowerCase());

  const newTemplate: SavedTemplate = {
    id: existingIndex >= 0 ? templates[existingIndex].id : Math.random().toString(36).substring(2, 11),
    username: username.toLowerCase(),
    name: name.trim(),
    data,
    createdAt: new Date().toISOString()
  };

  if (existingIndex >= 0) {
    templates[existingIndex] = newTemplate;
  } else {
    templates.push(newTemplate);
  }

  localStorage.setItem(TEMPLATES_KEY, JSON.stringify(templates));
  return newTemplate;
}

export function deleteUserTemplate(templateId: string): void {
  initDB();
  const rawTemplates = localStorage.getItem(TEMPLATES_KEY) || '[]';
  const templates: SavedTemplate[] = JSON.parse(rawTemplates);
  const filtered = templates.filter(t => t.id !== templateId);
  localStorage.setItem(TEMPLATES_KEY, JSON.stringify(filtered));
}
