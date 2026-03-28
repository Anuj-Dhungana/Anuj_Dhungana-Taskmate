import { renderCommentLite, formatRelativeTime, initialsFromName, toCommentAuthor } from './taskDetailUtils';

const TaskCommentSection = ({
    sortedComments,
    canAddComment,
    isAdminOrOwner,
    userInfo,
    commentDraft,
    onCommentChange,
    onCommentKeyDown,
    onSendComment,
    onDeleteComment,
    commentSubmitting,
    commentTextareaRef,
    mentionOpen,
    filteredMentionMembers,
    mentionIndex,
    onInsertMention,
}) => {
    return (
        <section className="rounded-xl border border-gray-100 bg-white h-[440px] flex flex-col overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100">
                <h3 className="text-sm font-semibold text-gray-800">Comments</h3>
            </div>
            <div className="flex-1 overflow-y-auto px-4 py-3">
                {sortedComments.length > 0 ? (
                    <div className="space-y-3">
                        {sortedComments.map((comment) => {
                            const author = toCommentAuthor(comment);
                            const authorName = author?.fullname || 'User';
                            const authorId = String(author?._id || '');
                            const canDelete =
                                isAdminOrOwner || authorId === String(userInfo?._id || '');
                            return (
                                <div key={comment._id} className="rounded-lg bg-gray-50 px-3 py-2.5">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex items-start gap-2.5 min-w-0">
                                            {author?.avatar ? (
                                                <img
                                                    src={author.avatar}
                                                    alt={authorName}
                                                    className="w-6 h-6 rounded-full object-cover shrink-0 mt-0.5"
                                                />
                                            ) : (
                                                <div className="w-6 h-6 rounded-full bg-blue-600 text-white text-[10px] font-semibold flex items-center justify-center shrink-0 mt-0.5">
                                                    {initialsFromName(authorName)}
                                                </div>
                                            )}
                                            <div className="min-w-0">
                                                <p className="text-xs font-semibold text-gray-900">{authorName}</p>
                                                <div
                                                    className="mt-0.5 text-sm text-gray-700 leading-5 break-words"
                                                    dangerouslySetInnerHTML={{ __html: renderCommentLite(comment.content) }}
                                                />
                                            </div>
                                        </div>
                                        {canDelete && (
                                            <button
                                                onClick={() => onDeleteComment(comment._id)}
                                                title={`Delete comment - ${formatRelativeTime(comment.createdAt)}`}
                                                className="text-[11px] text-red-500 hover:text-red-600 shrink-0"
                                            >
                                                Delete
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="h-full flex items-center justify-center">
                        <p className="text-sm text-gray-400">No comments yet</p>
                    </div>
                )}
            </div>
            <div className="border-t border-gray-100 p-3 bg-white">
                <div className="relative">
                    <textarea
                        ref={commentTextareaRef}
                        value={commentDraft}
                        onChange={onCommentChange}
                        onKeyDown={onCommentKeyDown}
                        placeholder="Add a comment... (use @ to mention people)"
                        rows={2}
                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    />
                    {mentionOpen && filteredMentionMembers.length > 0 && (
                        <div className="absolute left-0 right-0 bottom-full mb-1 max-h-44 overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-xl z-30">
                            <div className="px-3 py-1.5 text-[11px] font-semibold text-gray-400 uppercase tracking-wide border-b border-gray-100">
                                Members
                            </div>
                            {filteredMentionMembers.map((member, index) => (
                                <button
                                    key={member._id}
                                    type="button"
                                    onMouseDown={(e) => {
                                        e.preventDefault();
                                        onInsertMention(member);
                                    }}
                                    className={`w-full flex items-center gap-2.5 px-3 py-2 text-left transition-colors ${
                                        index === mentionIndex
                                            ? 'bg-blue-50 text-blue-700'
                                            : 'text-gray-700 hover:bg-gray-50'
                                    }`}
                                >
                                    {member.avatar ? (
                                        <img
                                            src={member.avatar}
                                            alt={member.fullname}
                                            className="w-6 h-6 rounded-full object-cover shrink-0"
                                        />
                                    ) : (
                                        <div className="w-6 h-6 rounded-full bg-blue-600 text-white text-[10px] font-semibold flex items-center justify-center shrink-0">
                                            {initialsFromName(member.fullname)}
                                        </div>
                                    )}
                                    <span className="text-sm font-medium truncate">{member.fullname}</span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
                <div className="mt-2 flex justify-end">
                    <button
                        onClick={onSendComment}
                        disabled={!canAddComment || commentSubmitting || !commentDraft.trim()}
                        className="h-9 px-4 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60 text-sm font-medium"
                    >
                        {commentSubmitting ? 'Posting...' : 'Post Comment'}
                    </button>
                </div>
            </div>
        </section>
    );
};

export default TaskCommentSection;
