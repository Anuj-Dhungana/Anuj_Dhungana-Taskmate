import { useCallback, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { X } from 'lucide-react';
import useAuthStore from '../../store/useAuthStore';
import ConfirmModal from './ConfirmModal';
import ProjectMemberPicker from './ProjectMemberPicker';
import ProjectAdvancedOptions from './ProjectAdvancedOptions';
import { useProjectForm, STATUS_OPTIONS, PRIORITY_OPTIONS } from '../../hooks/useProjectForm';
import { emitProjectDataChanged } from '../../utils/projectEvents';

const CreateProjectModal = ({ isOpen, onClose, workspaceId, onCreated, members = [] }) => {
    const navigate = useNavigate();
    const { userInfo } = useAuthStore();
    const modalRef = useRef(null);
    const nameInputRef = useRef(null);

    const form = useProjectForm(members, userInfo);

    const requestClose = useCallback(() => {
        if (form.hasUnsavedChanges) {
            form.setShowDiscardConfirm(true);
            return;
        }
        form.setShowDiscardConfirm(false);
        form.resetForm();
        onClose?.();
    }, [form.hasUnsavedChanges, onClose, form]);

    const confirmDiscardAndClose = () => {
        form.setShowDiscardConfirm(false);
        form.resetForm();
        onClose?.();
    };

    useEffect(() => {
        if (!isOpen) return;

        const trapFocus = (event) => {
            if (event.key !== 'Tab' || !modalRef.current) return;
            const focusables = Array.from(
                modalRef.current.querySelectorAll(
                    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
                )
            ).filter((el) => !el.disabled);
            if (focusables.length === 0) return;
            const first = focusables[0];
            const last = focusables[focusables.length - 1];
            if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
            else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
        };

        const keyHandler = (event) => {
            if (event.key === 'Escape') { event.preventDefault(); requestClose(); return; }
            trapFocus(event);
        };

        document.addEventListener('keydown', keyHandler);
        nameInputRef.current?.focus();
        return () => document.removeEventListener('keydown', keyHandler);
    }, [isOpen, requestClose]);

    const handleSubmit = async (event) => {
        event.preventDefault();
        form.setAttemptedSubmit(true);
        form.setError('');

        if (!form.name.trim()) { form.setError('Project Name is required.'); return; }
        if (form.dateError) { form.setError(form.dateError); return; }

        form.setLoading(true);
        try {
            const payload = form.buildPayload(workspaceId);
            const res = await axios.post('/api/projects', payload);
            const createdProject = res.data;

            onCreated?.(createdProject);
            toast.success('Project created successfully');
            emitProjectDataChanged({ workspaceId, projectId: createdProject?._id, source: 'create-project-modal' });
            form.resetForm();
            onClose?.();
            navigate(`/projects/${createdProject._id}`);
        } catch (err) {
            form.setError(err?.response?.data?.message || 'Failed to create project. Please try again.');
            form.setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <>
            <div
                className="fixed inset-0 z-50 bg-black/55 backdrop-blur-sm flex items-center justify-center px-4"
                onMouseDown={(e) => e.target === e.currentTarget && requestClose()}
                aria-hidden={false}
            >
                <div ref={modalRef} role="dialog" aria-modal="true" aria-label="Create Project"
                    className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl max-h-[85vh] overflow-y-auto">

                    <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-10">
                        <h2 className="text-lg font-bold text-gray-900">Create Project</h2>
                        <button type="button" onClick={requestClose}
                            className="w-8 h-8 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 flex items-center justify-center"
                            aria-label="Close create project modal">
                            <X size={18} />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">
                        {/* Project Name */}
                        <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1">Project Name *</label>
                            <input ref={nameInputRef} type="text" placeholder="Website Redesign"
                                className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                                value={form.name} onChange={(e) => form.setName(e.target.value)} />
                            {form.attemptedSubmit && !form.name.trim() && (
                                <p className="mt-1 text-xs text-red-600">Project Name is required.</p>
                            )}
                        </div>

                        {/* Description */}
                        <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1">Description</label>
                            <textarea rows={3} placeholder="Describe the goal and scope of this project"
                                className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all resize-y"
                                value={form.description} onChange={(e) => form.setDescription(e.target.value)} />
                        </div>

                        {/* Status & Priority */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1">Status</label>
                                <select value={form.status} onChange={(e) => form.setStatus(e.target.value)}
                                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-white">
                                    {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1">Priority</label>
                                <div className="w-full border-2 border-gray-200 rounded-xl p-1 flex gap-1 bg-white">
                                    {PRIORITY_OPTIONS.map((o) => (
                                        <button key={o} type="button" onClick={() => form.setPriority(o)}
                                            className={`flex-1 text-xs font-semibold rounded-lg py-2 transition ${
                                                form.priority === o ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:bg-gray-100'
                                            }`}>{o}</button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Timeline */}
                        <div>
                            <p className="text-xs font-semibold text-gray-700 mb-2">Timeline</p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs text-gray-600 mb-1">Start Date</label>
                                    <input type="date" value={form.startDate} onChange={(e) => form.setStartDate(e.target.value)}
                                        className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none" />
                                </div>
                                <div>
                                    <label className="block text-xs text-gray-600 mb-1">End Date</label>
                                    <input type="date" value={form.endDate} onChange={(e) => form.setEndDate(e.target.value)}
                                        className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none" />
                                </div>
                            </div>
                            <p className="mt-1 text-[11px] text-gray-500">Shown as project deadline in Workspace Calendar</p>
                            {!!form.dateError && <p className="mt-1 text-xs text-red-600">{form.dateError}</p>}
                        </div>

                        {/* Members */}
                        <ProjectMemberPicker
                            members={members}
                            selectedMembers={form.selectedMembers}
                            selectedList={form.selectedList}
                            isOpen={form.isMemberPickerOpen}
                            onToggleOpen={() => form.setIsMemberPickerOpen((v) => !v)}
                            onToggleMember={form.toggleMember}
                            onUpdateRole={form.updateMemberRole}
                            isAdminOrOwner={form.isAdminOrOwner}
                        />

                        {/* Advanced Options */}
                        {form.isAdminOrOwner && (
                            <ProjectAdvancedOptions
                                isOpen={form.showAdvanced}
                                onToggle={() => form.setShowAdvanced((v) => !v)}
                                projectColor={form.projectColor}
                                onColorChange={form.setProjectColor}
                                projectLabel={form.projectLabel}
                                onLabelChange={form.setProjectLabel}
                                calendarEnabled={form.calendarEnabled}
                                onCalendarChange={form.setCalendarEnabled}
                            />
                        )}

                        {/* Error */}
                        {!!form.error && (
                            <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                                {form.error}
                            </div>
                        )}

                        {/* Actions */}
                        <div className="pt-1 flex items-center justify-end gap-3">
                            <button type="button" onClick={requestClose}
                                className="px-4 py-2.5 rounded-lg border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50">
                                Cancel
                            </button>
                            <button type="submit" disabled={!form.canSubmit}
                                className={`px-4 py-2.5 rounded-lg text-sm font-semibold text-white transition ${
                                    form.canSubmit ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-indigo-300 cursor-not-allowed'
                                }`}>
                                {form.loading ? 'Creating...' : 'Create Project'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            <ConfirmModal
                isOpen={form.showDiscardConfirm}
                title="Discard Changes"
                message="You have unsaved changes. Are you sure you want to discard them?"
                confirmText="Discard"
                cancelText="Keep Editing"
                variant="danger"
                onClose={() => form.setShowDiscardConfirm(false)}
                onConfirm={confirmDiscardAndClose}
            />
        </>
    );
};

export default CreateProjectModal;
