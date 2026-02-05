import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { X, Calendar, User, Paperclip, FileText, Clock, Image as ImageIcon } from 'lucide-react';
import useWorkspaceStore from '../../store/userWorkspaceStore';

const TaskDetailModal = ({ isOpen, onClose, card, onUpdate }) => {
    if (!isOpen || !card) return null;

    const { selectedWorkspace } = useWorkspaceStore();
    
    // Local State for Form
    const [title, setTitle] = useState(card.title);
    const [description, setDescription] = useState(card.description || '');
    const [dueDate, setDueDate] = useState(card.dueDate ? card.dueDate.split('T')[0] : '');
    const [selectedAssignees, setSelectedAssignees] = useState(card.assignees?.map(u => u._id) || []);
    const [uploading, setUploading] = useState(false);
    const [attachments, setAttachments] = useState(card.attachments || []);

    // Save Changes Handler
    const handleSave = async () => {
        try {
            await axios.put(`/api/board/cards/${card._id}`, {
                title,
                description,
                dueDate,
                assignees: selectedAssignees
            });
            toast.success("Card updated");
            onUpdate(); // Refresh board
            onClose();
        } catch (err) {
            toast.error("Failed to update");
        }
    };

    // File Upload Handler
    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploading(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await axios.put(`/api/board/cards/${card._id}`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            toast.success("File uploaded");
            
            // Update local attachments state with the new file
            if (response.data.attachments) {
                setAttachments(response.data.attachments);
            }
            
            onUpdate(); // Refresh board to see new attachment
            // DON'T close the modal - let user continue editing
        } catch (err) {
            toast.error("Upload failed");
        }
        setUploading(false);
    };

    const toggleAssignee = (userId) => {
        if (selectedAssignees.includes(userId)) {
            setSelectedAssignees(selectedAssignees.filter(id => id !== userId));
        } else {
            setSelectedAssignees([...selectedAssignees, userId]);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50">
            <div className="bg-white rounded-2xl w-[900px] h-[80vh] flex flex-col relative shadow-2xl">
                
                {/* Header (Title) */}
                <div className="p-6 border-b border-gray-100 flex justify-between items-start">
                    <div className="w-full mr-8">
                        <input 
                            className="text-xl font-bold w-full outline-none border-b-2 border-transparent focus:border-blue-500 transition-all pb-1"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                        />
                        <p className="text-xs text-gray-500 mt-2">in list <span className="font-semibold text-blue-600">Current List</span></p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors"><X size={24}/></button>
                </div>

                <div className="flex-1 flex overflow-hidden">
                    {/* LEFT COLUMN (Main Content) */}
                    <div className="flex-1 p-6 overflow-y-auto space-y-6">
                        
                        {/* Description */}
                        <div>
                            <h3 className="text-sm font-bold text-gray-700 flex items-center gap-2 mb-2">
                                <FileText size={18}/> Description
                            </h3>
                            <textarea 
                                className="w-full h-32 p-4 border-2 border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:ring-2 ring-blue-500 outline-none text-sm transition-all resize-none"
                                placeholder="Add a more detailed description..."
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                            />
                        </div>

                        {/* Attachments */}
                        <div>
                            <h3 className="text-sm font-bold text-gray-700 flex items-center gap-2 mb-2">
                                <Paperclip size={18}/> Attachments
                            </h3>
                            <div className="flex flex-wrap gap-2 mb-2">
                                {attachments?.map((url, idx) => {
                                    // Check if it is an image
                                    const isImage = url.match(/\.(jpeg|jpg|gif|png)$/) != null;
                                    
                                    // Extract filename from URL (for display)
                                    const fileName = url.split('/').pop().split('.')[0].substring(0, 10) + "...";

                                    return (
                                        <a 
                                            key={idx} 
                                            href={url} 
                                            target="_blank" 
                                            rel="noreferrer" 
                                            className="flex flex-col items-center justify-center w-24 h-24 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border-2 border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all p-2 text-center no-underline"
                                            title="Click to view"
                                        >
                                            {isImage ? (
                                                <img src={url} alt="attachment" className="w-full h-16 object-cover rounded mb-1" />
                                            ) : (
                                                // Show PDF/File Icon for non-images
                                                <FileText size={32} className="text-red-500 mb-1" />
                                            )}
                                            
                                            <span className="text-[10px] text-gray-500 break-all leading-tight">
                                                {isImage ? "Image" : "PDF/File"}
                                            </span>
                                        </a>
                                    );
                                })}
                            </div>
                            
                            <label className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 rounded-xl cursor-pointer text-sm text-gray-700 transition-all font-medium shadow-sm">
                                <span>{uploading ? 'Uploading...' : 'Add File'}</span>
                                <input type="file" className="hidden" onChange={handleFileUpload} disabled={uploading} />
                            </label>
                        </div>

                    </div>

                    {/* RIGHT COLUMN (Sidebar Actions) */}
                    <div className="w-64 bg-gradient-to-b from-gray-50 to-gray-100 p-6 border-l border-gray-200 space-y-6 overflow-y-auto">
                        
                        {/* Due Date */}
                        <div>
                            <h4 className="text-xs font-bold text-gray-500 uppercase mb-2">Due Date</h4>
                            <div className="flex items-center gap-2 bg-white p-3 rounded-xl border-2 border-gray-200 shadow-sm">
                                <Clock size={16} className="text-gray-400"/>
                                <input 
                                    type="date" 
                                    className="outline-none text-sm bg-transparent w-full"
                                    value={dueDate}
                                    onChange={(e) => setDueDate(e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Assignees */}
                        <div>
                            <h4 className="text-xs font-bold text-gray-500 uppercase mb-2">Assign Members</h4>
                            <div className="space-y-1 max-h-40 overflow-y-auto">
                                {selectedWorkspace?.workspace.members.map(m => (
                                    <label key={m.user._id} className="flex items-center gap-2 p-2 hover:bg-white rounded-lg cursor-pointer transition-colors">
                                        <input 
                                            type="checkbox" 
                                            checked={selectedAssignees.includes(m.user._id)}
                                            onChange={() => toggleAssignee(m.user._id)}
                                            className="rounded text-blue-600 focus:ring-blue-500"
                                        />
                                        <span className="text-sm truncate font-medium text-gray-700">{m.user.fullname}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Save Button */}
                        <div className="pt-10">
                            <button 
                                onClick={handleSave}
                                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-2.5 rounded-xl font-semibold hover:from-blue-700 hover:to-blue-800 shadow-lg shadow-blue-500/30 transition-all"
                            >
                                Save Changes
                            </button>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
};

export default TaskDetailModal;