import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

const COLOR_OPTIONS = ['#6366F1', '#3B82F6', '#14B8A6', '#22C55E', '#F59E0B', '#EF4444'];

const formatDateForInput = (date) => {
    if (!date) return '';
    const d = new Date(date);
    if (isNaN(d.getTime())) return '';
    return d.toISOString().split('T')[0];
};

export const useProjectForm = (members, userInfo, initialProject = null) => {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [status, setStatus] = useState('Planning');
    const [priority, setPriority] = useState('Medium');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [selectedMembers, setSelectedMembers] = useState({});
    const [isMemberPickerOpen, setIsMemberPickerOpen] = useState(false);
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [projectColor, setProjectColor] = useState(COLOR_OPTIONS[0]);
    const [projectLabel, setProjectLabel] = useState('');
    const [calendarEnabled, setCalendarEnabled] = useState(true);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [attemptedSubmit, setAttemptedSubmit] = useState(false);
    const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);
    const initializedProjectIdRef = useRef(null);

    // Initialize form with project data in edit mode
    // Use ref to track initialization by project ID to avoid reinitializing on object reference changes
    useEffect(() => {
        const projectId = initialProject?._id;
        if (initialProject && projectId && initializedProjectIdRef.current !== projectId) {
            setName(initialProject.name || '');
            setDescription(initialProject.description || '');
            setStatus(initialProject.status || 'Planning');
            setPriority(initialProject.priority || 'Medium');
            setStartDate(formatDateForInput(initialProject.startDate));
            setEndDate(formatDateForInput(initialProject.dueDate));
            setProjectColor(initialProject.projectColor || COLOR_OPTIONS[0]);
            setCalendarEnabled(initialProject.calendarEnabled !== false);
            
            // Initialize selected members
            const membersMap = {};
            if (Array.isArray(initialProject.members)) {
                initialProject.members.forEach((m) => {
                    const userId = m?.user?._id || m?.user;
                    if (userId) {
                        membersMap[userId] = m.role || 'Contributor';
                    }
                });
            }
            setSelectedMembers(membersMap);
            
            // Show advanced if customized
            if (initialProject.projectColor !== COLOR_OPTIONS[0] || !initialProject.calendarEnabled) {
                setShowAdvanced(true);
            }
            
            initializedProjectIdRef.current = projectId;
        }
    }, [initialProject]);

    const myRole = members.find((m) => m.user?._id === userInfo?._id)?.role;
    const isAdminOrOwner = myRole === 'owner' || myRole === 'admin';

    const dateError = useMemo(() => {
        if (!startDate || !endDate) return '';
        const start = new Date(startDate);
        const end = new Date(endDate);
        if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return '';
        if (end < start) return 'End Date must be on or after Start Date.';
        return '';
    }, [startDate, endDate]);

    const selectedList = useMemo(() => {
        return Object.entries(selectedMembers)
            .map(([userId, role]) => {
                const m = members.find((item) => item.user?._id === userId);
                return m ? { userId, role, fullname: m.user.fullname } : null;
            })
            .filter(Boolean);
    }, [selectedMembers, members]);

    const hasUnsavedChanges = useMemo(() => {
        // In edit mode, check if any field changed from initial values
        if (initialProject && initializedProjectIdRef.current === initialProject._id) {
            return (
                name.trim() !== (initialProject.name || '') ||
                description.trim() !== (initialProject.description || '') ||
                status !== (initialProject.status || 'Planning') ||
                priority !== (initialProject.priority || 'Medium') ||
                startDate !== formatDateForInput(initialProject.startDate) ||
                endDate !== formatDateForInput(initialProject.dueDate) ||
                projectColor !== (initialProject.projectColor || COLOR_OPTIONS[0]) ||
                calendarEnabled !== (initialProject.calendarEnabled !== false) ||
                JSON.stringify(selectedMembers) !== JSON.stringify(
                    (initialProject.members || []).reduce((acc, m) => {
                        const userId = m?.user?._id || m?.user;
                        if (userId) acc[userId] = m.role || 'Contributor';
                        return acc;
                    }, {})
                )
            );
        }
        
        // In create mode, check if any field has a value
        return (
            name.trim() !== '' ||
            description.trim() !== '' ||
            status !== 'Planning' ||
            priority !== 'Medium' ||
            startDate !== '' ||
            endDate !== '' ||
            Object.keys(selectedMembers).length > 0 ||
            showAdvanced ||
            projectColor !== COLOR_OPTIONS[0] ||
            projectLabel.trim() !== '' ||
            calendarEnabled !== true
        );
    }, [name, description, status, priority, startDate, endDate, selectedMembers, showAdvanced, projectColor, projectLabel, calendarEnabled, initialProject]);

    const canSubmit = name.trim().length > 0 && !dateError && !loading;

    const resetForm = useCallback(() => {
        setName('');
        setDescription('');
        setStatus('Planning');
        setPriority('Medium');
        setStartDate('');
        setEndDate('');
        setSelectedMembers({});
        setIsMemberPickerOpen(false);
        setShowAdvanced(false);
        setProjectColor(COLOR_OPTIONS[0]);
        setProjectLabel('');
        setCalendarEnabled(true);
        setLoading(false);
        setError('');
        setAttemptedSubmit(false);
        initializedProjectIdRef.current = null;
    }, []);

    const toggleMember = useCallback((userId) => {
        if (!isAdminOrOwner) return;
        setSelectedMembers((prev) => {
            const next = { ...prev };
            if (next[userId]) delete next[userId];
            else next[userId] = 'Contributor';
            return next;
        });
    }, [isAdminOrOwner]);

    const updateMemberRole = useCallback((userId, role) => {
        if (!isAdminOrOwner) return;
        setSelectedMembers((prev) => ({ ...prev, [userId]: role }));
    }, [isAdminOrOwner]);

    const buildPayload = useCallback((workspaceId) => {
        const tags = Array.from(
            new Set(
                [priority.toLowerCase(), projectLabel.trim()]
                    .map((v) => String(v || '').trim())
                    .filter(Boolean)
            )
        );

        return {
            name: name.trim(),
            description: description.trim(),
            workspaceId,
            status,
            priority,
            tags,
            startDate: startDate || undefined,
            dueDate: endDate || undefined,
            members: isAdminOrOwner
                ? Object.entries(selectedMembers).map(([user, role]) => ({ user, role }))
                : [],
            projectColor,
            calendarEnabled,
        };
    }, [name, description, status, priority, projectLabel, startDate, endDate, isAdminOrOwner, selectedMembers, projectColor, calendarEnabled]);

    return {
        // Fields
        name, setName,
        description, setDescription,
        status, setStatus,
        priority, setPriority,
        startDate, setStartDate,
        endDate, setEndDate,
        selectedMembers, selectedList,
        isMemberPickerOpen, setIsMemberPickerOpen,
        showAdvanced, setShowAdvanced,
        projectColor, setProjectColor,
        projectLabel, setProjectLabel,
        calendarEnabled, setCalendarEnabled,
        loading, setLoading,
        error, setError,
        attemptedSubmit, setAttemptedSubmit,
        showDiscardConfirm, setShowDiscardConfirm,
        // Computed
        isAdminOrOwner, dateError, hasUnsavedChanges, canSubmit,
        // Actions
        resetForm, toggleMember, updateMemberRole, buildPayload,
    };
};

export const STATUS_OPTIONS = [
    { label: 'Planning', value: 'Planning' },
    { label: 'Active', value: 'Active' },
    { label: 'On Hold', value: 'On Hold' },
    { label: 'Completed', value: 'Completed' },
];

export const PRIORITY_OPTIONS = ['Low', 'Medium', 'High'];
export { COLOR_OPTIONS };
