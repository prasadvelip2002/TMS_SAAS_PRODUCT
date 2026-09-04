"use client";

import { useEffect, useState } from "react";
import { fetchApi } from "@/lib/api";
import { ProtoTable, Td } from "@/components/PrototypeUI";
import { Search, Grid, List, Plus, Users, X, Activity, UserPlus } from "lucide-react";

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    passwordHash: "",
    role: "Internal User"
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadUsers = async () => {
    try {
      const data = await fetchApi("/Users");
      setUsers(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await fetchApi("/Users", {
        method: "POST",
        body: JSON.stringify({
          ...formData,
          tenantId: 1 // hardcoded to first tenant for prototype
        }),
      });
      setFormData({ name: "", email: "", passwordHash: "", role: "Internal User" });
      setIsFormOpen(false);
      loadUsers();
    } catch (error) {
      console.error(error);
      alert("Failed to add user");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this user?")) return;
    try {
      await fetchApi(`/Users/${id}`, { method: "DELETE" });
      loadUsers();
    } catch (error) {
      alert("Failed to delete user");
    }
  };

  return (
    <div className="max-w-[1600px] mx-auto pb-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Team & Users</h1>
          <p className="text-sm font-medium text-slate-500 mt-1">Manage access, roles, and invite your team members.</p>
        </div>
        <button 
          onClick={() => setIsFormOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-5 py-2.5 rounded-xl shadow-[0_4px_14px_rgba(37,99,235,0.25)] transition-all flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Add User
        </button>
      </div>

      {/* Search & Toolbar */}
      <div className="bg-white rounded-2xl shadow-sm ring-1 ring-slate-200/50 p-2 mb-6 flex items-center justify-between">
        <div className="flex items-center px-4 gap-3 flex-1">
          <Search className="w-5 h-5 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search users by name, email, or role..." 
            className="w-full bg-transparent border-none focus:outline-none text-sm text-slate-700 font-medium placeholder:text-slate-400 py-2.5"
          />
        </div>
        <div className="flex items-center gap-2 pr-2">
          <button onClick={() => setViewMode('grid')} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold border transition-colors ${viewMode === 'grid' ? 'bg-blue-50 text-blue-700 border-blue-100' : 'text-slate-500 border-transparent hover:bg-slate-50'}`}>
            <Grid className="w-4 h-4" /> Grid
          </button>
          <button onClick={() => setViewMode('list')} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold border transition-colors ${viewMode === 'list' ? 'bg-blue-50 text-blue-700 border-blue-100' : 'text-slate-500 border-transparent hover:bg-slate-50'}`}>
            <List className="w-4 h-4" /> Table
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="flex justify-center p-16">
          <Activity className="animate-spin text-blue-600 w-8 h-8" />
        </div>
      ) : users.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-20 flex flex-col items-center justify-center text-center mt-2">
           <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mb-6">
             <UserPlus className="w-8 h-8" />
           </div>
           <h3 className="text-xl font-bold text-slate-900 mb-2">No users found</h3>
           <p className="text-slate-500 text-[14.5px] mb-8 max-w-sm">Start building your team by adding users and assigning roles.</p>
           <button 
             onClick={() => setIsFormOpen(true)}
             className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-3 rounded-xl shadow-[0_4px_14px_rgba(37,99,235,0.25)] transition-all flex items-center gap-2"
           >
             <Plus className="w-5 h-5" />
             Add First User
           </button>
        </div>
      ) : viewMode === 'list' ? (
        <div className="bg-white rounded-2xl shadow-sm ring-1 ring-slate-200/50 overflow-hidden">
          <ProtoTable headers={["ID", "NAME", "EMAIL", "ROLE", "ACTIONS"]}>
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-slate-50 transition-colors group">
                <Td className="font-mono font-semibold text-[12.5px]">{user.id}</Td>
                <Td className="font-semibold text-slate-900">{user.name}</Td>
                <Td>{user.email}</Td>
                <Td>
                  <span className="px-[8px] py-[3px] bg-[#e0f2fe] text-[#075985] rounded-[6px] text-[11px] font-medium border border-[#bae6fd]">
                    {user.role}
                  </span>
                </Td>
                <Td>
                  <button 
                    onClick={() => handleDelete(user.id)}
                    className="text-muted-text hover:text-red-500 text-[12px] font-medium opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    Delete
                  </button>
                </Td>
              </tr>
            ))}
          </ProtoTable>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {users.map((user) => (
            <div key={user.id} className="bg-white border border-slate-200 rounded-2xl p-6 hover:shadow-lg transition-all group relative flex flex-col h-full overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-blue-400 opacity-0 group-hover:opacity-100 transition-opacity" />
              
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center border border-slate-100 text-blue-600 font-bold uppercase">
                    {user.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-lg">{user.name}</h3>
                    <p className="text-xs font-mono text-slate-500">ID: {user.id}</p>
                  </div>
                </div>
              </div>
              
              <div className="flex-1 space-y-3 mb-6 mt-2">
                <div className="flex items-center text-sm text-slate-600">
                  <div className="w-6 h-6 rounded-full bg-slate-50 flex items-center justify-center mr-3 border border-slate-100"><span className="text-[10px]">✉️</span></div>
                  <span className="truncate">{user.email || 'No Email'}</span>
                </div>
                <div className="flex items-center text-sm text-slate-600">
                  <div className="w-6 h-6 rounded-full bg-slate-50 flex items-center justify-center mr-3 border border-slate-100"><span className="text-[10px]">🏢</span></div>
                  <span className="truncate">{user.tenantId ? `Tenant ${user.tenantId}` : 'Platform'}</span>
                </div>
              </div>
              
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between mt-auto">
                <div>
                  <span className="px-[8px] py-[3px] bg-[#e0f2fe] text-[#075985] rounded-[6px] text-[11px] font-bold border border-[#bae6fd] uppercase tracking-wider">
                    {user.role}
                  </span>
                </div>
                <button 
                  onClick={(e) => { e.stopPropagation(); handleDelete(user.id); }}
                  className="text-slate-400 hover:text-red-500 p-2 rounded-lg hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Slide-over Form Panel */}
      {isFormOpen && (
        <div className="fixed inset-0 z-[100] flex justify-end">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm transition-opacity" 
            onClick={() => setIsFormOpen(false)} 
          />
          
          {/* Slide-over Panel */}
          <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col transform transition-transform duration-300 ease-in-out border-l border-slate-200">
             {/* Form Header */}
             <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
               <div>
                 <h3 className="font-bold text-lg text-slate-900 tracking-tight">Add New User</h3>
                 <p className="text-[13px] font-medium text-slate-500 mt-0.5">Invite a team member to the platform</p>
               </div>
               <button 
                 onClick={() => setIsFormOpen(false)} 
                 className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-xl transition-colors"
               >
                 <X className="w-5 h-5" />
               </button>
             </div>
             
             {/* Form Body - Scrollable */}
             <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
               <form id="userForm" onSubmit={handleSubmit} className="space-y-5">
                 <div>
                   <label className="block text-[11.5px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Name</label>
                   <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full border border-slate-200 rounded-xl px-4 py-3 text-[14px] bg-slate-50 hover:bg-slate-100 focus:bg-white text-slate-800 font-medium outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm" placeholder="e.g. John Doe" />
                 </div>
                 <div>
                   <label className="block text-[11.5px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Email / Username</label>
                   <input required type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full border border-slate-200 rounded-xl px-4 py-3 text-[14px] bg-slate-50 hover:bg-slate-100 focus:bg-white text-slate-800 font-medium outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm" placeholder="john@example.com" />
                 </div>
                 <div>
                   <label className="block text-[11.5px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Password</label>
                   <input required type="password" value={formData.passwordHash} onChange={e => setFormData({...formData, passwordHash: e.target.value})} className="w-full border border-slate-200 rounded-xl px-4 py-3 text-[14px] bg-slate-50 hover:bg-slate-100 focus:bg-white text-slate-800 font-medium outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm" placeholder="••••••••" />
                 </div>
                 <div>
                   <label className="block text-[11.5px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Role</label>
                   <select required value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})} className="w-full border border-slate-200 rounded-xl px-4 py-3 text-[14px] bg-slate-50 hover:bg-slate-100 focus:bg-white text-slate-800 font-medium outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm">
                     <option value="Internal User">Internal User</option>
                     <option value="Accounts">Accounts</option>
                     <option value="Manager">Manager</option>
                     <option value="Tenant Admin">Tenant Admin</option>
                   </select>
                 </div>
               </form>
             </div>
             
             {/* Form Footer */}
             <div className="p-6 border-t border-slate-100 bg-white">
               <button 
                 type="submit" 
                 form="userForm" 
                 disabled={isSubmitting}
                 className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl shadow-[0_4px_14px_rgba(37,99,235,0.25)] transition-all flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed"
               >
                 {isSubmitting ? (
                   <><Activity className="w-5 h-5 mr-2 animate-spin" /> Adding...</>
                 ) : (
                   "Add User"
                 )}
               </button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
}
