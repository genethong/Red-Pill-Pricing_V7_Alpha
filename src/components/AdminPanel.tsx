import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { UserPlus, Trash2, ShieldCheck, Mail, Calendar, AlertCircle, Key, Check, X, Upload, GripVertical } from 'lucide-react';
import { getAllUsers, addUser, removeUser, resetUserPassword, User, getSystemTemplates, deleteSystemTemplate, saveSystemTemplate, saveAllSystemTemplates } from '../lib/userDb';
import { cn } from '../lib/utils';
import { Button, Field } from './ui';

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

  void isDarkMode;

  return (
    <div className="admin-panel bg-[var(--bg-elevated)] rounded-[var(--radius-card)] p-[var(--space-6)] space-y-6 shadow-[0_0_0_0.5px_var(--separator)]">
      <div className="flex items-center justify-between gap-[var(--space-4)]">
        <div>
          <h3 className="font-[family-name:var(--font-title)] text-[length:var(--text-title-3-size)] leading-[var(--text-title-3-line)] tracking-[var(--text-title-3-tracking)] font-semibold text-[var(--label)]">Administration</h3>
          <p className="mt-1 text-[length:var(--text-footnote-size)] leading-[var(--text-footnote-line)] text-[var(--label-secondary)]">Create, monitor, and remove user credentials</p>
        </div>
        <Button variant="gray" size="compact" onClick={onClose}>
          Close
        </Button>
      </div>

      {error && (
        <div className="flex items-center gap-2 px-[var(--space-4)] py-[var(--space-3)] bg-[var(--tint-soft)] text-[var(--system-red)] text-[length:var(--text-footnote-size)] rounded-[var(--radius-element)]">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="flex items-center gap-2 px-[var(--space-4)] py-[var(--space-3)] bg-[color-mix(in_srgb,var(--system-green)_12%,transparent)] text-[var(--system-green)] text-[length:var(--text-footnote-size)] rounded-[var(--radius-element)]">
          <ShieldCheck className="w-4 h-4 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* User Creation Section */}
        <div className="bg-[var(--fill-quaternary)] rounded-[var(--radius-element)] p-[var(--space-5)] space-y-4 shadow-[0_0_0_0.5px_var(--separator)]">
          <h4 className="text-[length:var(--text-subhead-size)] leading-[var(--text-subhead-line)] font-semibold text-[var(--label)] flex items-center gap-2">
            <UserPlus className="w-4 h-4 text-[var(--tint)]" />
            Create user
          </h4>

          <form onSubmit={handleCreateUser} className="space-y-4">
            <Field
              label="Username"
              type="text"
              value={newUsername}
              onChange={(e) => setNewUsername(e.target.value)}
              placeholder="e.g. john_doe"
            />
            <Field
              label="Password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Password (min 4 chars)"
            />
            <div className="flex flex-col gap-[var(--space-1)]">
              <label className="text-[length:var(--text-footnote-size)] leading-[var(--text-footnote-line)] text-[var(--label-secondary)]">Access role</label>
              <select
                value={newRole}
                onChange={(e) => setNewRole(e.target.value as any)}
                className="w-full h-[var(--control-height)] px-[var(--space-3)] rounded-[var(--radius-control)] bg-[var(--fill-tertiary)] text-[var(--label)] text-[length:var(--text-body-size)] outline-none shadow-[0_0_0_0.5px_var(--separator)] focus:shadow-[0_0_0_2px_var(--tint-soft),0_0_0_0.5px_var(--tint)]"
              >
                <option value="user">User (standard access)</option>
                <option value="admin">Admin (full access)</option>
              </select>
            </div>
            <Button type="submit" variant="filled" className="w-full">
              Add user
            </Button>
          </form>
        </div>

        {/* User Listing Section */}
        <div className="lg:col-span-2 bg-[var(--fill-quaternary)] rounded-[var(--radius-element)] p-[var(--space-5)] space-y-4 shadow-[0_0_0_0.5px_var(--separator)]">
          <h4 className="text-[length:var(--text-subhead-size)] leading-[var(--text-subhead-line)] font-semibold text-[var(--label)]">
            Accounts ({users.length})
          </h4>

          <div className="overflow-x-auto max-h-[300px] overflow-y-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="shadow-[inset_0_-0.5px_0_var(--separator)] text-[var(--label-secondary)]">
                  <th className="py-2.5 px-3">Username</th>
                  <th className="py-2.5 px-3">Role</th>
                  <th className="py-2.5 px-3">Created</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {users.map((usr) => (
                  <tr key={usr.username} className="group shadow-[inset_0_-0.5px_0_var(--separator)] last:shadow-none hover:bg-[var(--fill-quaternary)]">
                    <td className="py-3 px-3 font-[family-name:var(--font-numeric)] font-medium text-[var(--label)]">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-[var(--system-green)]" />
                        {usr.username}
                        {usr.username === currentUser.username && (
                          <span className="text-[length:var(--text-caption-2-size)] bg-[var(--fill-tertiary)] text-[var(--label-secondary)] rounded-[var(--radius-capsule)] px-1.5 py-0.5">You</span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <span className={cn(
                        "inline-block text-[length:var(--text-caption-2-size)] px-2 py-0.5 rounded-[var(--radius-capsule)]",
                        usr.role === 'admin'
                          ? "bg-[var(--tint-soft)] text-[var(--tint)]"
                          : "bg-[var(--fill-tertiary)] text-[var(--label-secondary)]"
                      )}>
                        {usr.role}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-[var(--label-tertiary)] flex items-center gap-1.5 font-[family-name:var(--font-numeric)] text-[length:var(--text-caption-1-size)]">
                      <Calendar className="w-3.5 h-3.5" />
                      {new Date(usr.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-3 text-right">
                      {usr.username !== currentUser.username ? (
                        usernameToDeleteConfirm === usr.username ? (
                          <div className="flex items-center gap-1.5 justify-end shrink-0">
                            <span className="text-[length:var(--text-caption-1-size)] text-[var(--system-red)]">Delete?</span>
                            <Button size="compact" variant="destructive" onClick={() => handleRemoveUser(usr.username)}>Yes</Button>
                            <Button size="compact" variant="gray" onClick={() => setUsernameToDeleteConfirm(null)}>No</Button>
                          </div>
                        ) : usernameToResetPassword === usr.username ? (
                          <div className="flex items-center gap-1.5 justify-end shrink-0">
                            <input
                              type="password"
                              placeholder="New pass"
                              value={resetPasswordValue}
                              onChange={(e) => setResetPasswordValue(e.target.value)}
                              className="bg-[var(--fill-tertiary)] rounded-[var(--radius-control)] px-2.5 py-1 text-[length:var(--text-caption-1-size)] text-[var(--label)] outline-none shadow-[0_0_0_0.5px_var(--separator)] focus:shadow-[0_0_0_2px_var(--tint-soft),0_0_0_0.5px_var(--tint)] font-[family-name:var(--font-numeric)] w-28 h-7 text-left"
                              autoFocus
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleResetPassword(usr.username);
                              }}
                            />
                            <button
                              onClick={() => handleResetPassword(usr.username)}
                              className="p-1 bg-[var(--system-green)] text-[var(--on-tint)] rounded-[var(--radius-control)] cursor-pointer flex items-center justify-center w-7 h-7"
                              title="Save Password"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                setUsernameToResetPassword(null);
                                setResetPasswordValue('');
                              }}
                              className="p-1 bg-[var(--fill-tertiary)] text-[var(--label-secondary)] hover:text-[var(--label)] rounded-[var(--radius-control)] cursor-pointer flex items-center justify-center w-7 h-7"
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
                              className="p-1 text-[var(--label-tertiary)] hover:text-[var(--system-orange)] rounded-[var(--radius-control)] hover:bg-[var(--fill-tertiary)] cursor-pointer"
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
                                className="p-1 text-[var(--label-tertiary)] hover:text-[var(--system-red)] rounded-[var(--radius-control)] hover:bg-[var(--fill-tertiary)] cursor-pointer"
                                title="Delete user and user data"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        )
                      ) : (
                        <span className="text-[length:var(--text-caption-1-size)] text-[var(--label-quaternary)]">Protected</span>
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
      <div className="shadow-[inset_0_0.5px_0_var(--separator)] pt-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h4 className="text-[length:var(--text-subhead-size)] leading-[var(--text-subhead-line)] font-semibold text-[var(--label)]">
              System templates ({sysTemplates.length})
            </h4>
            <p className="text-[length:var(--text-caption-1-size)] leading-[var(--text-caption-1-line)] text-[var(--label-tertiary)] mt-0.5">
              Loaded for New Project and shared with all users. Drag the grip <GripVertical className="inline-block w-3.5 h-3.5 -mt-0.5" /> to reorder.
            </p>
          </div>
          <div>
            <label className="inline-flex items-center gap-1.5 px-[var(--space-3)] h-8 rounded-[var(--radius-control)] bg-[var(--tint-soft)] text-[var(--tint)] text-[length:var(--text-footnote-size)] cursor-pointer">
              <Upload className="w-3.5 h-3.5" />
              Upload JSON
              <input
                type="file"
                accept=".json"
                onChange={handleSystemTemplateUpload}
                className="hidden"
              />
            </label>
          </div>
        </div>

        <div className="bg-[var(--fill-quaternary)] rounded-[var(--radius-element)] p-[var(--space-5)] shadow-[0_0_0_0.5px_var(--separator)]">
          <div className="overflow-x-auto max-h-[240px] overflow-y-auto custom-scrollbar">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="shadow-[inset_0_-0.5px_0_var(--separator)] text-[var(--label-secondary)]">
                  <th className="py-2.5 px-3 w-8"></th>
                  <th className="py-2.5 px-3">Template</th>
                  <th className="py-2.5 px-3">Configuration</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {sysTemplates.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-4 text-center text-[var(--label-tertiary)]">No system templates found. Upload one or save a project with “Save as System Template” checked.</td>
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
                        className={cn(
                          "group shadow-[inset_0_-0.5px_0_var(--separator)] last:shadow-none hover:bg-[var(--fill-quaternary)]",
                          isDragging && "opacity-40 bg-[var(--fill-tertiary)]"
                        )}
                      >
                        <td className="py-3 px-3 cursor-grab active:cursor-grabbing text-[var(--label-quaternary)] hover:text-[var(--label-secondary)] w-8">
                          <GripVertical className="w-4 h-4" />
                        </td>
                        <td className="py-3 px-3 font-medium text-[var(--label)]">
                          {t.name}
                        </td>
                        <td className="py-3 px-3 text-[var(--label-tertiary)] font-[family-name:var(--font-numeric)] text-[length:var(--text-caption-1-size)]">
                          Grid: {t.data?.gridCondition || 'Unknown'} | DG: {t.data?.dg?.enabled ? 'Yes' : 'No'} | Solar: {t.data?.solar?.enabled ? 'Yes' : 'No'}
                        </td>
                        <td className="py-3 px-3 text-right">
                          {templateToDeleteConfirm === t.name ? (
                            <div className="flex items-center gap-1.5 justify-end shrink-0">
                              <span className="text-[length:var(--text-caption-1-size)] text-[var(--system-red)]">Delete?</span>
                              <Button size="compact" variant="destructive" onClick={() => handleDeleteSystemTemplate(t.name)}>Yes</Button>
                              <Button size="compact" variant="gray" onClick={() => setTemplateToDeleteConfirm(null)}>No</Button>
                            </div>
                          ) : (
                            <button
                              onClick={() => {
                                clearMessages();
                                setTemplateToDeleteConfirm(t.name);
                              }}
                              className="p-1.5 text-[var(--label-tertiary)] hover:text-[var(--system-red)] rounded-[var(--radius-control)] hover:bg-[var(--fill-tertiary)] cursor-pointer"
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
