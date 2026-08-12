import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { UserPlus, Trash2, ShieldCheck, Mail, Calendar, AlertCircle, Key, Check, X, Upload, GripVertical } from 'lucide-react';
import { getAllUsers, addUser, removeUser, resetUserPassword, User, getSystemTemplates, deleteSystemTemplate, saveSystemTemplate, saveAllSystemTemplates } from '../lib/userDb';
import { cn } from '../lib/utils';

interface AdminPanelProps {
  currentUser: User;
  onClose: () => void;
  isDarkMode: boolean;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ currentUser, onClose, isDarkMode }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<'admin' | 'user'>('user');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [usernameToDeleteConfirm, setUsernameToDeleteConfirm] = useState<string | null>(null);
  const [usernameToResetPassword, setUsernameToResetPassword] = useState<string | null>(null);
  const [resetPasswordValue, setResetPasswordValue] = useState('');
  const [sysTemplates, setSysTemplates] = useState<{ name: string; data: any }[]>([]);
  const [templateToDeleteConfirm, setTemplateToDeleteConfirm] = useState<string | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const handleSystemTemplateUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    clearMessages();
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const fileContent = event.target?.result as string;
        const parsed = JSON.parse(fileContent);
        const templateData = parsed.data || parsed;
        const templateName = parsed.name || file.name.replace(".json", "");

        if (!templateData || typeof templateData !== 'object') {
          setError('Invalid template format. The JSON does not contain a valid configuration object.');
          return;
        }

        saveSystemTemplate(templateName, templateData);
        loadSystemTemplates();
        setSuccess(`System template "${templateName}" uploaded and saved successfully!`);
      } catch (err) {
        setError("Failed to parse the template JSON file.");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const updated = [...sysTemplates];
    const draggedItem = updated[draggedIndex];
    updated.splice(draggedIndex, 1);
    updated.splice(index, 0, draggedItem);

    setDraggedIndex(index);
    setSysTemplates(updated);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    saveAllSystemTemplates(sysTemplates);
    setSuccess('Global system templates sequence updated successfully!');
  };

  useEffect(() => {
    loadUsers();
    loadSystemTemplates();
  }, []);

  const loadUsers = () => {
    setUsers(getAllUsers());
  };

  const loadSystemTemplates = () => {
    setSysTemplates(getSystemTemplates());
  };

  const clearMessages = () => {
    setError(null);
    setSuccess(null);
    setUsernameToDeleteConfirm(null);
    setUsernameToResetPassword(null);
    setTemplateToDeleteConfirm(null);
  };

  const handleDeleteSystemTemplate = (name: string) => {
    clearMessages();
    deleteSystemTemplate(name);
    setTemplateToDeleteConfirm(null);
    loadSystemTemplates();
    setSuccess(`System template "${name}" deleted successfully!`);
  };

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();

    if (!newUsername.trim() || !newPassword.trim()) {
      setError('Please fill in both username and password.');
      return;
    }

    const res = addUser(newUsername.trim(), newPassword.trim(), newRole);
    if (res.success) {
      setSuccess(res.message);
      setNewUsername('');
      setNewPassword('');
      setNewRole('user');
      loadUsers();
    } else {
      setError(res.message);
    }
  };

  const handleRemoveUser = (usernameToRemove: string) => {
    clearMessages();
    const res = removeUser(usernameToRemove, currentUser.username);
    if (res.success) {
      setSuccess(res.message);
      setUsernameToDeleteConfirm(null);
      loadUsers();
    } else {
      setError(res.message);
    }
  };

  const handleResetPassword = (usernameToReset: string) => {
    clearMessages();
    if (!resetPasswordValue.trim()) {
      setError('Password cannot be empty.');
      return;
    }
    const res = resetUserPassword(usernameToReset, resetPasswordValue.trim());
    if (res.success) {
      setSuccess(res.message);
      setUsernameToResetPassword(null);
      setResetPasswordValue('');
      loadUsers();
    } else {
      setError(res.message);
    }
  };

  return (
    <div className={cn(
      "border rounded-2xl p-6 space-y-6",
      isDarkMode ? "bg-white/5 border-white/10" : "bg-white border-gray-200 shadow-sm"
    )}>
      <div className="flex items-center justify-between">
        <div>
          <h3 className={cn(
            "text-sm font-bold uppercase tracking-wider",
            isDarkMode ? "text-gray-400" : "text-gray-950"
          )}>User Administration & Access Control</h3>
          <p className={cn(
            "text-[10px] font-bold uppercase tracking-widest mt-0.5",
            isDarkMode ? "text-gray-500" : "text-gray-600"
          )}>Create, monitor, and remove user credentials on this platform</p>
        </div>
        <button
          onClick={onClose}
          className={cn(
            "px-4 py-1.5 rounded-lg text-[10px] uppercase font-bold tracking-wider transition-all border cursor-pointer",
            isDarkMode
              ? "bg-white/5 hover:bg-white/10 border-white/5 text-white"
              : "bg-gray-100 hover:bg-gray-200 border-gray-300 text-gray-800 shadow-sm"
          )}
        >
          Close Admin Mode
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 px-4 py-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="flex items-center gap-2 px-4 py-3 bg-green-500/10 border border-green-500/20 text-green-400 text-xs rounded-xl">
          <ShieldCheck className="w-4 h-4 shrink-0 text-green-500" />
          <span>{success}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* User Creation Section */}
        <div className="bg-black/30 border border-white/5 rounded-xl p-5 space-y-4">
          <h4 className="text-xs font-bold text-gray-300 uppercase tracking-widest flex items-center gap-2">
            <UserPlus className="w-4 h-4 text-red-500" />
            Create User Account
          </h4>

          <form onSubmit={handleCreateUser} className="space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Username</label>
              <input
                type="text"
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                placeholder="e.g. john_doe"
                className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-red-500 text-white font-mono"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Password (min 4 chars)"
                className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-red-500 text-white font-mono"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Access Role</label>
              <select
                value={newRole}
                onChange={(e) => setNewRole(e.target.value as any)}
                className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-red-500 text-white"
              >
                <option value="user">User (Standard Access)</option>
                <option value="admin">Admin (Full Access Control)</option>
              </select>
            </div>

            <button
              type="submit"
              className="w-full py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all"
            >
              Add User Account
            </button>
          </form>
        </div>

        {/* User Listing Section */}
        <div className="lg:col-span-2 bg-black/30 border border-white/5 rounded-xl p-5 space-y-4">
          <h4 className="text-xs font-bold text-gray-300 uppercase tracking-widest">
            Registered Access Accounts ({users.length})
          </h4>

          <div className="overflow-x-auto max-h-[300px] overflow-y-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-white/10 text-[9px] font-bold text-gray-400 uppercase tracking-wider">
                  <th className="py-2.5 px-3">Username</th>
                  <th className="py-2.5 px-3">Role</th>
                  <th className="py-2.5 px-3">Created At</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {users.map((usr) => (
                  <tr key={usr.username} className="hover:bg-white/[0.02] group transition-colors">
                    <td className="py-3 px-3 font-mono font-bold text-white flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                      {usr.username}
                      {usr.username === currentUser.username && (
                        <span className="text-[8px] bg-white/10 text-white rounded px-1.5 py-0.5">YOU</span>
                      )}
                    </td>
                    <td className="py-3 px-3">
                      <span className={`inline-block text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full ${
                        usr.role === 'admin' 
                          ? 'bg-red-500/10 text-red-400 border border-red-500/20' 
                          : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                      }`}>
                        {usr.role}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-gray-500 flex items-center gap-1.5 font-mono text-[10px]">
                      <Calendar className="w-3.5 h-3.5" />
                      {new Date(usr.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-3 text-right">
                      {usr.username !== currentUser.username ? (
                        usernameToDeleteConfirm === usr.username ? (
                          <div className="flex items-center gap-1.5 justify-end shrink-0">
                            <span className="text-[9px] text-[#F40F1D] font-black uppercase tracking-wider animate-pulse">Confirm delete?</span>
                            <button
                              onClick={() => handleRemoveUser(usr.username)}
                              className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg text-[10px] font-bold uppercase transition-all cursor-pointer"
                            >
                              Yes
                            </button>
                            <button
                              onClick={() => setUsernameToDeleteConfirm(null)}
                              className="px-2 py-1 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white rounded-lg text-[10px] uppercase font-bold transition-all cursor-pointer"
                            >
                              No
                            </button>
                          </div>
                        ) : usernameToResetPassword === usr.username ? (
                          <div className="flex items-center gap-1.5 justify-end shrink-0">
                            <input
                              type="password"
                              placeholder="New pass"
                              value={resetPasswordValue}
                              onChange={(e) => setResetPasswordValue(e.target.value)}
                              className="bg-black/60 border border-white/15 rounded-lg px-2.5 py-1 text-[11px] text-white focus:outline-none focus:border-red-500 font-mono w-28 h-7 text-left"
                              autoFocus
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleResetPassword(usr.username);
                              }}
                            />
                            <button
                              onClick={() => handleResetPassword(usr.username)}
                              className="p-1 bg-green-600 hover:bg-green-700 text-white rounded-lg cursor-pointer flex items-center justify-center w-7 h-7"
                              title="Save Password"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                setUsernameToResetPassword(null);
                                setResetPasswordValue('');
                              }}
                              className="p-1 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white rounded-lg cursor-pointer flex items-center justify-center w-7 h-7"
                              title="Cancel"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 justify-end shrink-0">
                            <button
                              onClick={() => {
                                clearMessages();
                                setUsernameToResetPassword(usr.username);
                                setResetPasswordValue('');
                              }}
                              className="p-1 text-gray-400 hover:text-amber-500 rounded-lg bg-white/5 hover:bg-amber-500/10 border border-white/5 hover:border-amber-500/20 transition-all shadow-sm cursor-pointer"
                              title="Reset password"
                            >
                              <Key className="w-3.5 h-3.5" />
                            </button>

                            {usr.username !== 'admin' && (
                              <button
                                onClick={() => {
                                  clearMessages();
                                  setUsernameToDeleteConfirm(usr.username);
                                }}
                                className="p-1 text-gray-400 hover:text-[#F40F1D] rounded-lg bg-white/5 hover:bg-red-500/10 border border-white/5 hover:border-red-500/20 transition-all shadow-sm cursor-pointer"
                                title="Delete user and user data"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        )
                      ) : (
                        <span className="text-[9px] text-gray-600 italic font-bold">Protected</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Global System Templates Section */}
      <div className="border-t border-white/5 pt-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h4 className="text-xs font-bold text-gray-300 uppercase tracking-widest flex items-center gap-2">
              Global System Templates ({sysTemplates.length})
            </h4>
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-0.5">
              These templates are loaded during "New Project" and apply to all users on the platform. Drag the grip handler <GripVertical className="inline-block w-3.5 h-3.5 -mt-0.5" /> to rearrange the sequence.
            </p>
          </div>
          <div>
            <label className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600/10 border border-red-500/20 hover:bg-red-600/20 rounded-lg text-[10px] uppercase font-bold tracking-wider text-red-400 transition-all cursor-pointer shadow-sm">
              <Upload className="w-3.5 h-3.5" />
              Upload Template JSON
              <input
                type="file"
                accept=".json"
                onChange={handleSystemTemplateUpload}
                className="hidden"
              />
            </label>
          </div>
        </div>

        <div className="bg-black/30 border border-white/5 rounded-xl p-5">
          <div className="overflow-x-auto max-h-[240px] overflow-y-auto custom-scrollbar">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-white/10 text-[9px] font-bold text-gray-400 uppercase tracking-wider">
                  <th className="py-2.5 px-3 w-8"></th>
                  <th className="py-2.5 px-3">Template Name</th>
                  <th className="py-2.5 px-3">Associated Configurations</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {sysTemplates.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-4 text-center text-gray-500 italic">No system templates found. Upload one or save a project with "Save as System Template" checked to create one.</td>
                  </tr>
                ) : (
                  sysTemplates.map((t, idx) => {
                    const isDragging = draggedIndex === idx;
                    return (
                      <tr 
                        key={t.name} 
                        draggable
                        onDragStart={(e) => handleDragStart(e, idx)}
                        onDragOver={(e) => handleDragOver(e, idx)}
                        onDragEnd={handleDragEnd}
                        className={`hover:bg-white/[0.02] group transition-all duration-150 ${isDragging ? 'opacity-40 bg-white/5 border border-dashed border-red-500/40' : ''}`}
                      >
                        <td className="py-3 px-3 cursor-grab active:cursor-grabbing text-gray-600 hover:text-gray-300 transition-colors w-8">
                          <GripVertical className="w-4 h-4" />
                        </td>
                        <td className="py-3 px-3 font-medium text-white">
                          {t.name}
                        </td>
                        <td className="py-3 px-3 text-gray-400 font-mono text-[10px]">
                          Grid: {t.data?.gridCondition || 'Unknown'} | DG: {t.data?.dg?.enabled ? 'Yes' : 'No'} | Solar: {t.data?.solar?.enabled ? 'Yes' : 'No'}
                        </td>
                        <td className="py-3 px-3 text-right">
                          {templateToDeleteConfirm === t.name ? (
                            <div className="flex items-center gap-1.5 justify-end shrink-0">
                              <span className="text-[9px] text-[#F40F1D] font-black uppercase tracking-wider animate-pulse">Confirm delete?</span>
                              <button
                                onClick={() => handleDeleteSystemTemplate(t.name)}
                                className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg text-[10px] font-bold uppercase transition-all cursor-pointer animate-none"
                              >
                                Yes
                              </button>
                              <button
                                onClick={() => setTemplateToDeleteConfirm(null)}
                                className="px-2 py-1 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white rounded-lg text-[10px] uppercase font-bold transition-all cursor-pointer"
                              >
                                No
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => {
                                clearMessages();
                                setTemplateToDeleteConfirm(t.name);
                              }}
                              className="p-1.5 text-gray-400 hover:text-[#F40F1D] rounded-lg bg-white/5 hover:bg-red-500/10 border border-white/5 hover:border-red-500/20 transition-all shadow-sm cursor-pointer"
                              title="Delete system template (applies to all users)"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
