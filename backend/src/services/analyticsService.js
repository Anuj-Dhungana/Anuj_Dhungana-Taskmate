import Project from '../models/Project.js';
import List from '../models/List.js';
import Card from '../models/Card.js';
import Message from '../models/Message.js';

/**
 * Calculate comprehensive workspace analytics
 * @param {string} workspaceId - Workspace ID
 * @param {number} daysNum - Number of days to analyze
 * @param {Object} workspace - Populated workspace object
 * @returns {Promise<Object>} Analytics data with KPI, projectHealth, communication, teamWorkload
 */
export const calculateWorkspaceAnalytics = async (workspaceId, daysNum, workspace) => {
    const periodStart = new Date();
    periodStart.setDate(periodStart.getDate() - daysNum);
    periodStart.setHours(0, 0, 0, 0);

    // ── Fetch core data ──
    const projects = await Project.find({ workspace: workspaceId })
        .select('name status dueDate startDate createdAt members priority')
        .sort({ createdAt: -1 });
    const projectIds = projects.map(p => p._id);

    const lists = await List.find({ projectId: { $in: projectIds } }).select('_id title projectId');
    const listIsDone = new Map(lists.map(l => [l._id.toString(), (l.title || '').toLowerCase() === 'done']));
    const listIsInProgress = new Map(lists.map(l => [l._id.toString(), (l.title || '').toLowerCase() === 'in progress']));

    const allCards = await Card.find({ projectId: { $in: projectIds }, archived: { $ne: true } })
        .select('title projectId listId assignees dueDate priority updatedAt createdAt')
        .populate('assignees', 'fullname avatar');

    const channels = await (async () => {
        try {
            const { default: Channel } = await import('../models/Channel.js');
            return Channel.find({ workspace: workspaceId }).select('name type members');
        } catch { return []; }
    })();

    const allMessages = await Message.find({ workspaceId, createdAt: { $gte: periodStart } })
        .select('channelId sender content createdAt')
        .populate('sender', 'fullname avatar');

    // Calculate all analytics sections
    const kpi = calculateKPI(allCards, projects, allMessages, listIsDone, daysNum, periodStart);
    const projectHealth = calculateProjectHealth(
        allCards,
        projects,
        listIsDone,
        listIsInProgress,
        daysNum,
        periodStart
    );
    const communication = await calculateCommunication(allMessages, channels, allCards, listIsDone, daysNum, periodStart);
    const teamWorkload = calculateTeamWorkload(allCards, workspace, listIsDone, listIsInProgress);

    return {
        kpi,
        projectHealth,
        communication,
        teamWorkload
    };
};

/**
 * Calculate KPI metrics
 */
function calculateKPI(allCards, projects, allMessages, listIsDone, daysNum, periodStart) {
    const totalCards = allCards.length;
    const completedCards = allCards.filter(c => listIsDone.get(c.listId.toString())).length;
    const completionRate = totalCards === 0 ? 0 : Math.round((completedCards / totalCards) * 100);

    const weeksInPeriod = Math.max(1, Math.ceil(daysNum / 7));
    const cardsInPeriod = allCards.filter(c => c.createdAt >= periodStart && listIsDone.get(c.listId.toString())).length;
    const throughputWeekly = Math.round(cardsInPeriod / weeksInPeriod);

    const now = new Date();
    const overdueCards = allCards.filter(c => c.dueDate && new Date(c.dueDate) < now && !listIsDone.get(c.listId.toString()));

    const activeProjects = projects.filter(p => (p.status || '').toLowerCase() === 'active');
    const totalMessages = allMessages.length;

    return {
        completionRate,
        completedCards,
        totalCards,
        throughputWeekly,
        overdueTasks: overdueCards.length,
        activeProjects: activeProjects.length,
        totalMessages
    };
}

const PRIORITY_LEVELS = ['High', 'Medium', 'Low'];
const WORKLOAD_PROJECT_STATUSES = new Set(['active', 'planning']);

const toPriority = (value) => {
    const normalized = String(value || '').trim().toLowerCase();
    if (normalized === 'high') return 'High';
    if (normalized === 'low') return 'Low';
    return 'Medium';
};

/**
 * Calculate project health metrics
 */
function calculateProjectHealth(allCards, projects, listIsDone, listIsInProgress, daysNum, periodStart) {
    const now = new Date();
    const weeksInPeriod = Math.max(1, Math.ceil(daysNum / 7));

    // Velocity / throughput per week
    const velocity = [];
    for (let w = weeksInPeriod - 1; w >= 0; w--) {
        const weekStart = new Date(now);
        weekStart.setDate(weekStart.getDate() - (w + 1) * 7);
        const weekEnd = new Date(now);
        weekEnd.setDate(weekEnd.getDate() - w * 7);
        const label = weekStart.toLocaleDateString('en', { month: 'short', day: 'numeric' });
        const count = allCards.filter(c => {
            if (!listIsDone.get(c.listId.toString())) return false;
            const d = new Date(c.updatedAt);
            return d >= weekStart && d < weekEnd;
        }).length;
        velocity.push({ week: label, completed: count });
    }

    // Cumulative flow per week
    const cumulativeFlow = [];
    for (let w = weeksInPeriod - 1; w >= 0; w--) {
        const snapDate = new Date(now);
        snapDate.setDate(snapDate.getDate() - w * 7);
        const label = snapDate.toLocaleDateString('en', { month: 'short', day: 'numeric' });
        let todo = 0, inProgress = 0, done = 0;
        allCards.forEach(c => {
            if (new Date(c.createdAt) > snapDate) return;
            const lid = c.listId.toString();
            if (listIsDone.get(lid)) done++;
            else if (listIsInProgress.get(lid)) inProgress++;
            else todo++;
        });
        cumulativeFlow.push({ week: label, 'To Do': todo, 'In Progress': inProgress, 'Done': done });
    }

    // Project priority distribution (current workload projects only)
    const workloadProjects = projects.filter((project) =>
        WORKLOAD_PROJECT_STATUSES.has(String(project?.status || '').trim().toLowerCase())
    );
    const priorityDistribution = PRIORITY_LEVELS.map((priority) => ({
        priority,
        count: workloadProjects.filter((project) => toPriority(project?.priority) === priority)
            .length,
    }));

    // Task priority completion metrics (selected date range)
    const cardsCreatedInRange = allCards.filter(
        (card) => new Date(card.createdAt).getTime() >= periodStart.getTime()
    );

    const completionRateByPriority = PRIORITY_LEVELS.map((priority) => {
        const cardsForPriority = cardsCreatedInRange.filter(
            (card) => toPriority(card.priority) === priority
        );
        const completed = cardsForPriority.filter((card) => {
            if (!listIsDone.get(card.listId.toString())) return false;
            return new Date(card.updatedAt).getTime() >= periodStart.getTime();
        }).length;
        const total = cardsForPriority.length;
        const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

        return {
            priority,
            total,
            completed,
            completionRate,
        };
    });

    // Project progress comparison
    const projectProgress = projects.map(p => {
        const pid = p._id.toString();
        const pCards = allCards.filter(c => c.projectId.toString() === pid);
        const pDone = pCards.filter(c => listIsDone.get(c.listId.toString())).length;
        const progress = pCards.length === 0 ? 0 : Math.round((pDone / pCards.length) * 100);
        return {
            _id: p._id, name: p.name, status: p.status, dueDate: p.dueDate,
            totalCards: pCards.length, doneCards: pDone, progress,
            membersCount: p.members?.length || 0
        };
    });

    // Stuck tasks (in progress for >3 days)
    const stuckTasks = allCards
        .filter(c => listIsInProgress.get(c.listId.toString()))
        .map(c => {
            const daysStuck = Math.floor((now - new Date(c.updatedAt)) / (1000 * 60 * 60 * 24));
            if (daysStuck < 3) return null;
            const project = projects.find(p => p._id.toString() === c.projectId.toString());
            return {
                _id: c._id, title: c.title,
                project: project?.name || 'Unknown',
                projectId: c.projectId,
                assignees: c.assignees || [],
                status: 'In Progress',
                daysStuck,
                lastUpdated: c.updatedAt
            };
        })
        .filter(Boolean)
        .sort((a, b) => b.daysStuck - a.daysStuck);

    return {
        velocity,
        cumulativeFlow,
        priorityDistribution,
        completionRateByPriority,
        projectProgress,
        stuckTasks
    };
}

/**
 * Calculate communication metrics
 */
async function calculateCommunication(allMessages, channels, allCards, listIsDone, daysNum, periodStart) {
    const now = new Date();

    // Messages per day in period
    const messagesPerDay = {};
    const tasksCompletedPerDay = {};
    for (let d = 0; d < daysNum; d++) {
        const day = new Date(now);
        day.setDate(day.getDate() - d);
        const key = day.toISOString().slice(0, 10);
        messagesPerDay[key] = 0;
        tasksCompletedPerDay[key] = 0;
    }
    allMessages.forEach(m => {
        const key = new Date(m.createdAt).toISOString().slice(0, 10);
        if (messagesPerDay[key] !== undefined) messagesPerDay[key]++;
    });
    allCards.filter(c => listIsDone.get(c.listId.toString()) && c.updatedAt >= periodStart).forEach(c => {
        const key = new Date(c.updatedAt).toISOString().slice(0, 10);
        if (tasksCompletedPerDay[key] !== undefined) tasksCompletedPerDay[key]++;
    });

    const messagesVsTasks = Object.keys(messagesPerDay).sort().map(date => ({
        date: new Date(date).toLocaleDateString('en', { month: 'short', day: 'numeric' }),
        messages: messagesPerDay[date],
        tasksCompleted: tasksCompletedPerDay[date] || 0
    }));

    // Messages per channel
    const channelMsgCounts = {};
    allMessages.forEach(m => {
        const cid = m.channelId?.toString() || '';
        channelMsgCounts[cid] = (channelMsgCounts[cid] || 0) + 1;
    });
    const channelArr = Array.isArray(channels) ? channels : (channels ? await channels : []);
    const channelActivity = channelArr
        .filter(ch => ch.type !== 'dm')
        .map(ch => ({
            name: ch.name,
            messages: channelMsgCounts[ch._id.toString()] || 0
        }))
        .sort((a, b) => b.messages - a.messages);

    // DM vs Channel ratio
    const dmChannelIds = new Set(channelArr.filter(ch => ch.type === 'dm').map(ch => ch._id.toString()));
    let dmCount = 0, channelCount = 0;
    allMessages.forEach(m => {
        const cid = m.channelId?.toString() || '';
        if (dmChannelIds.has(cid)) dmCount++;
        else channelCount++;
    });

    // Simple word frequency from messages (top discussion topics)
    const stopWords = new Set(['the', 'a', 'an', 'is', 'it', 'to', 'and', 'or', 'of', 'in', 'on', 'for', 'i', 'we', 'you', 'this', 'that', 'was', 'are', 'be', 'has', 'have', 'do', 'does', 'did', 'will', 'would', 'can', 'could', 'should', 'not', 'no', 'yes', 'just', 'so', 'but', 'with', 'from', 'at', 'by', 'us', 'me', 'my', 'its', 'they', 'them', 'our', 'your', 'if', 'then', 'what', 'when', 'how', 'all', 'been', 'more', 'some', 'any']);
    const wordCounts = {};
    const wordChannelMap = {};
    allMessages.forEach(m => {
        const words = (m.content || '').toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/);
        const cid = m.channelId?.toString() || '';
        const chName = channelArr.find(ch => ch._id.toString() === cid)?.name || 'unknown';
        words.forEach(w => {
            if (w.length < 3 || stopWords.has(w)) return;
            wordCounts[w] = (wordCounts[w] || 0) + 1;
            if (!wordChannelMap[w]) wordChannelMap[w] = {};
            wordChannelMap[w][chName] = (wordChannelMap[w][chName] || 0) + 1;
        });
    });
    const topKeywords = Object.entries(wordCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 15)
        .map(([keyword, count]) => {
            const chEntries = Object.entries(wordChannelMap[keyword] || {}).sort(([, a], [, b]) => b - a);
            return { keyword, count, channel: chEntries[0]?.[0] || '-' };
        });

    return {
        messagesVsTasks,
        channelActivity,
        dmVsChannel: { dm: dmCount, channel: channelCount },
        topKeywords
    };
}

/**
 * Calculate team workload metrics
 */
function calculateTeamWorkload(allCards, workspace, listIsDone, listIsInProgress) {
    const now = new Date();

    const memberMap = new Map();
    workspace.members.forEach(m => {
        const u = m.user;
        if (!u) return;
        const uid = u._id?.toString() || u.toString();
        memberMap.set(uid, {
            _id: uid,
            fullname: u.fullname || 'Unknown',
            avatar: u.avatar || '',
            role: m.role
        });
    });

    const workloadByMember = {};
    allCards.forEach(c => {
        (c.assignees || []).forEach(a => {
            const uid = a._id?.toString() || a.toString();
            if (!workloadByMember[uid]) workloadByMember[uid] = { todo: 0, inProgress: 0, done: 0, overdue: 0 };
            const lid = c.listId.toString();
            if (listIsDone.get(lid)) workloadByMember[uid].done++;
            else if (listIsInProgress.get(lid)) workloadByMember[uid].inProgress++;
            else workloadByMember[uid].todo++;
            if (c.dueDate && new Date(c.dueDate) < now && !listIsDone.get(lid)) {
                workloadByMember[uid].overdue++;
            }
        });
    });

    const memberWorkload = [];
    const memberCompleted = [];
    memberMap.forEach((info, uid) => {
        const w = workloadByMember[uid] || { todo: 0, inProgress: 0, done: 0, overdue: 0 };
        const activeCount = w.todo + w.inProgress;
        memberWorkload.push({
            ...info,
            todo: w.todo,
            inProgress: w.inProgress,
            overdue: w.overdue,
            active: activeCount,
            overloaded: activeCount > 10
        });
        memberCompleted.push({ ...info, completed: w.done });
    });
    memberWorkload.sort((a, b) => b.active - a.active);
    memberCompleted.sort((a, b) => b.completed - a.completed);

    // Workload insights
    const mostLoaded = memberWorkload[0] || null;
    const mostOverdue = [...memberWorkload].sort((a, b) => b.overdue - a.overdue)[0] || null;
    const bestThroughput = memberCompleted[0] || null;

    return {
        memberWorkload,
        memberCompleted,
        insights: {
            mostLoaded: mostLoaded ? { name: mostLoaded.fullname, count: mostLoaded.active } : null,
            mostOverdue: mostOverdue ? { name: mostOverdue.fullname, count: mostOverdue.overdue } : null,
            bestThroughput: bestThroughput ? { name: bestThroughput.fullname, count: bestThroughput.completed } : null
        }
    };
}
