import React, { useState, useMemo, useRef, useEffect } from 'react';
import { UserAccount } from '../types';
import { Search, Bell, Trash2, Edit2, AlertTriangle, Check, X, ShieldAlert, Users, MoreVertical } from 'lucide-react';
import { validateEmail, validatePhone, validateUsername } from '../utils/validation';
import Pagination from './Pagination';
import { fetchUsers, updateUser, deleteUser } from '../api/users';

interface AdminPageProps {
  onUpdateUser: (updatedUser: UserAccount) => void;
}

export default function AdminPage({ onUpdateUser }: AdminPageProps) {
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeMenuUserId, setActiveMenuUserId] = useState<string | null>(null);
  
  // Interactive pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Inline editing row states
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editUsername, setEditUsername] = useState('');
  const [editFullName, setEditFullName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Deletion modals state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<UserAccount | null>(null);

  const menuRef = useRef<HTMLDivElement>(null);

  // Close menus on click away
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setActiveMenuUserId(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadUsers = async () => {
    try {
      const data = await fetchUsers();
      setUsers(data);
    } catch (err) {
      console.error('Failed to load users', err);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  // Filter User lists
  const filteredUsers = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return users.filter(u => 
      u.username.toLowerCase().includes(q) || 
      u.fullName.toLowerCase().includes(q) || 
      u.email.toLowerCase().includes(q) ||
      u.phone.includes(q)
    );
  }, [users, searchQuery]);

  // Reset page when search query changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage) || 1;
  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredUsers.slice(start, start + itemsPerPage);
  }, [filteredUsers, currentPage]);

  const startIdx = (currentPage - 1) * itemsPerPage + 1;
  const endIdx = Math.min(currentPage * itemsPerPage, filteredUsers.length);

  const handleOpenMenu = (userId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setActiveMenuUserId(userId === activeMenuUserId ? null : userId);
  };

  // Inline Validation checks
  const validateRow = (id: string, username: string, email: string, phone: string): boolean => {
    const errors: Record<string, string> = {};
    let isValid = true;

    // Username check
    if (!username.trim()) {
      errors.username = 'Username is required';
      isValid = false;
    } else if (!validateUsername(username)) {
      errors.username = 'No spaces allowed';
      isValid = false;
    } else {
      // Unique test
      const usernameExists = users.some(u => u.id !== id && u.username.toLowerCase() === username.toLowerCase().trim());
      if (usernameExists) {
        errors.username = 'Username must be unique';
        isValid = false;
      }
    }

    // Email check
    if (!email.trim()) {
      errors.email = 'Email is required';
      isValid = false;
    } else if (!validateEmail(email)) {
      errors.email = 'Invalid email format';
      isValid = false;
    } else {
      // Unique test
      const emailExists = users.some(u => u.id !== id && u.email.toLowerCase() === email.toLowerCase().trim());
      if (emailExists) {
        errors.email = 'Email must be unique';
        isValid = false;
      }
    }

    // Phone checks
    if (phone.trim() !== '-' && phone.trim() !== '') {
      if (!validatePhone(phone)) {
        errors.phone = 'Invalid characters';
        isValid = false;
      }
    }

    setValidationErrors(errors);
    return isValid;
  };

  const handleStartEdit = (user: UserAccount) => {
    setEditingUserId(user.id);
    setEditUsername(user.username);
    setEditFullName(user.fullName);
    setEditEmail(user.email);
    setEditPhone(user.phone);
    setValidationErrors({});
    setActiveMenuUserId(null);
  };

  const handleSaveEdit = async (user: UserAccount) => {
    if (!validateRow(user.id, editUsername, editEmail, editPhone)) return;

    const updatedData = {
      id: user.id,
      username: editUsername.trim(),
      fullName: editFullName.trim() || 'No Name',
      email: editEmail.trim(),
      phone: editPhone.trim() || '-'
    };

    try {
      const data = await updateUser(updatedData);

      const updatedUser = { ...user, ...data };
      setUsers(prev => prev.map(u => u.id === user.id ? updatedUser : u));
      onUpdateUser(updatedUser);
      setEditingUserId(null);
    } catch (err: any) {
      alert(err.message || 'Failed to update user');
    }
  };

  const handleCancelEdit = () => {
    setEditingUserId(null);
    setValidationErrors({});
  };

  const handleOpenDeleteDialog = (user: UserAccount) => {
    setUserToDelete(user);
    setIsDeleteModalOpen(true);
    setActiveMenuUserId(null);
  };

  const handleConfirmDelete = async () => {
    if (userToDelete) {
      try {
        await deleteUser(userToDelete.id);
        setUsers(prev => prev.filter(u => u.id !== userToDelete.id));
        setIsDeleteModalOpen(false);
        setUserToDelete(null);
      } catch (err: any) {
        alert(err.message || 'Failed to delete user');
      }
    }
  };

  return (
    <div className="space-y-6 flex-1 font-sans relative">
      
      {/* Configure page Header section matching mockup 4 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-[#e5e2e1]" id="admin-view-title-h2">User Administration</h2>
          <p className="text-[#bbcabf] text-sm mt-1">Configure system access and update account profiles.</p>
        </div>
      </div>

      {/* Accounts List Table Card */}
      <div className="bg-[#201f1f] rounded-xl border border-white/5 overflow-hidden flex flex-col shadow-2xl">
        
        {/* Dynamic Client Query Search bar section */}
        <div className="p-4 border-b border-white/5 bg-[#1c1b1b]/30">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#bbcabf]/50 w-4.5 h-4.5" />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-[#1c1b1b] border border-white/5 rounded-full py-2 pl-9 pr-4 text-xs font-sans text-white focus:outline-none focus:border-[#4edea3] focus:ring-1 focus:ring-[#4edea3] w-full placeholder:text-[#bbcabf]/40"
              placeholder="Search accounts..." 
            />
          </div>
        </div>

        <div className="overflow-x-auto min-h-64">
          <table className="w-full text-left border-collapse" id="user-table">
            <thead>
              <tr className="border-b border-white/10 bg-[#1c1b1b]/40">
                <th className="py-4 px-6 font-mono text-[11px] text-[#bbcabf] font-semibold tracking-wider uppercase">Username</th>
                <th className="py-4 px-6 font-mono text-[11px] text-[#bbcabf] font-semibold tracking-wider uppercase">Full Name</th>
                <th className="py-4 px-6 font-mono text-[11px] text-[#bbcabf] font-semibold tracking-wider uppercase">Email Address</th>
                <th className="py-4 px-6 font-mono text-[11px] text-[#bbcabf] font-semibold tracking-wider uppercase">Phone Number</th>
                <th className="py-4 px-6 w-16"></th>
              </tr>
            </thead>
            <tbody className="text-xs text-[#e5e2e1] [&>tr:nth-child(even)]:bg-white/[0.005]">
              {paginatedUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-[#bbcabf]/50 font-mono text-xs">
                    No registry accounts found.
                  </td>
                </tr>
              ) : (
                paginatedUsers.map((user) => {
                  const isEditing = editingUserId === user.id;

                  return (
                    <tr 
                      key={user.id} 
                      className={`border-b border-white/5 hover:bg-white/[0.015] transition-all group ${
                        isEditing ? 'bg-[#4edea3]/[0.02] border-[#4edea3]/20' : ''
                      }`}
                    >
                      {/* USERNAME CELL */}
                      <td className="py-3 px-6 relative">
                        {isEditing ? (
                          <div className="relative">
                            <input 
                              type="text" 
                              value={editUsername} 
                              onChange={(e) => {
                                setEditUsername(e.target.value);
                                validateRow(user.id, e.target.value, editEmail, editPhone);
                              }}
                              className={`bg-[#161616] border rounded px-2 py-1.5 text-xs text-white focus:outline-none focus:ring-1 w-full ${
                                validationErrors.username ? 'border-[#ffb4ab] focus:ring-[#ffb4ab]' : 'border-white/10 focus:border-[#4edea3] focus:ring-[#4edea3]'
                              }`}
                            />
                            {validationErrors.username && (
                              <div className="absolute left-0 top-full mt-1 bg-[#93000a] text-[#ffdad6] text-[10px] py-1 px-2.5 rounded shadow-lg z-30 font-mono">
                                {validationErrors.username}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="font-semibold text-[#4edea3]">{user.username}</div>
                        )}
                      </td>

                      {/* FULL NAME CELL */}
                      <td className="py-3 px-6">
                        {isEditing ? (
                          <input 
                            type="text" 
                            value={editFullName} 
                            onChange={(e) => setEditFullName(e.target.value)}
                            className="bg-[#161616] border border-white/10 focus:border-[#4edea3] rounded px-2 py-1.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-[#4edea3] w-full"
                          />
                        ) : (
                          <div className={user.isUnverified ? 'text-[#bbcabf] italic' : ''}>
                            {user.fullName}
                          </div>
                        )}
                      </td>

                      {/* EMAIL ADDRESS CELL */}
                      <td className="py-3 px-6 text-[#bbcabf] relative">
                        {isEditing ? (
                          <div className="relative">
                            <input 
                              type="text" 
                              value={editEmail} 
                              onChange={(e) => {
                                setEditEmail(e.target.value);
                                validateRow(user.id, editUsername, e.target.value, editPhone);
                              }}
                              className={`bg-[#161616] border rounded px-2 py-1.5 text-xs text-white focus:outline-none focus:ring-1 w-full ${
                                validationErrors.email ? 'border-[#ffb4ab] focus:ring-[#ffb4ab]' : 'border-white/10 focus:border-[#4edea3] focus:ring-[#4edea3]'
                              }`}
                            />
                            {validationErrors.email && (
                              <div className="absolute left-0 top-full mt-1 bg-[#93000a] text-[#ffdad6] text-[10px] py-1 px-2.5 rounded shadow-lg z-30 font-mono">
                                {validationErrors.email}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span>{user.email}</span>
                        )}
                      </td>

                      {/* PHONE NUMBER CELL */}
                      <td className="py-3 px-6 text-[#bbcabf] font-mono relative">
                        {isEditing ? (
                          <div className="relative">
                            <input 
                              type="text" 
                              value={editPhone} 
                              onChange={(e) => {
                                setEditPhone(e.target.value);
                                validateRow(user.id, editUsername, editEmail, e.target.value);
                              }}
                              className={`bg-[#161616] border rounded px-2 py-1.5 text-xs text-white focus:outline-none focus:ring-1 w-full ${
                                validationErrors.phone ? 'border-[#ffb4ab] focus:ring-[#ffb4ab]' : 'border-white/10 focus:border-[#4edea3] focus:ring-[#4edea3]'
                              }`}
                            />
                            {validationErrors.phone && (
                              <div className="absolute left-0 top-full mt-1 bg-[#93000a] text-[#ffdad6] text-[10px] py-1 px-2.5 rounded shadow-lg z-30 font-mono">
                                {validationErrors.phone}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span>{user.phone}</span>
                        )}
                      </td>

                      {/* MORE CONTROLS ACTION TRIGGER */}
                      <td className="py-3 px-6 text-right relative">
                        {isEditing ? (
                          <div className="flex items-center gap-1 justify-end">
                            <button 
                              onClick={() => handleSaveEdit(user)}
                              className="p-1 text-[#4edea3] hover:bg-[#4edea3]/10 rounded cursor-pointer transition-colors"
                              title="Save details"
                            >
                              <Check className="w-4.5 h-4.5" />
                            </button>
                            <button 
                              onClick={handleCancelEdit}
                              className="p-1 text-[#ffb4ab] hover:bg-rose-500/10 rounded cursor-pointer transition-colors"
                              title="Discard edits"
                            >
                              <X className="w-4.5 h-4.5" />
                            </button>
                          </div>
                        ) : (
                          <div className="inline-block relative">
                            <button 
                              onClick={(e) => handleOpenMenu(user.id, e)}
                              className="text-[#bbcabf] hover:text-[#4edea3] transition-all p-1 hover:bg-white/5 rounded-full cursor-pointer"
                            >
                              <MoreVertical className="w-4.5 h-4.5" />
                            </button>
                            {activeMenuUserId === user.id && (
                              <div 
                                ref={menuRef}
                                className="absolute right-0 top-full mt-1.5 z-50 w-44 bg-[#1e1e1e] border border-white/10 rounded-lg shadow-2xl py-1 text-xs text-left"
                              >
                                <button 
                                  onClick={() => handleStartEdit(user)}
                                  className="w-full text-left px-4 py-2.5 text-[#e5e2e1] hover:bg-[#4edea3]/10 hover:text-[#4edea3] transition-all flex items-center gap-3 cursor-pointer"
                                >
                                  <Edit2 className="w-4 h-4" />
                                  <span>Edit Record</span>
                                </button>
                                <div className="h-px bg-white/5 my-1"></div>
                                <button 
                                  onClick={() => handleOpenDeleteDialog(user)}
                                  className="w-full text-left px-4 py-2.5 text-[#ffb4ab] hover:bg-rose-500/10 transition-all flex items-center gap-3 cursor-pointer"
                                >
                                  <Trash2 className="w-4 h-4" />
                                  <span>Delete User</span>
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Dynamic Pagination details matched from mockup */}
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          startIdx={filteredUsers.length > 0 ? startIdx : 0}
          endIdx={endIdx}
          totalItems={filteredUsers.length}
          containerClassName="border-t border-white/10 bg-[#1c1b1b]/50 px-6 py-4 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs"
        />

      </div>

      {/* CONFIRMATION ACCREDATIVE DELETION DIALOG */}
      {isDeleteModalOpen && userToDelete && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#201f1f] border border-white/10 p-6 rounded-xl shadow-2xl max-w-md w-full animate-scale-in">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-rose-500/10 flex items-center justify-center text-[#ffb4ab]">
                <AlertTriangle className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-bold text-white tracking-tight">Confirm Deletion</h3>
            </div>
            
            <p className="text-[#bbcabf] text-xs mb-6 leading-relaxed">
              Are you sure you want to permanently delete user <strong className="text-white">"{userToDelete.username}"</strong>? All associated financial logs and permissions will be erased.
            </p>

            <div className="flex justify-end gap-3 text-xs">
              <button 
                onClick={() => { setIsDeleteModalOpen(false); setUserToDelete(null); }}
                className="px-4 py-2.5 rounded border border-white/10 text-[#bbcabf] hover:text-white hover:bg-white/5 transition-all text-sm font-mono uppercase cursor-pointer"
              >
                Cancel
              </button>
              <button 
                onClick={handleConfirmDelete}
                className="px-5 py-2.5 rounded bg-[#ffb4ab] text-rose-950 font-bold hover:bg-rose-300 transition-all text-sm font-sans flex items-center gap-1.5 cursor-pointer shadow-lg shadow-rose-950/20"
              >
                Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
