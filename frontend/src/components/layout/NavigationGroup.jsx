import NavigationItem from './NavigationItem';

const NavigationGroup = ({ group, isCollapsed, iconSize, showDivider }) => {
    return (
        <div className={isCollapsed ? 'space-y-2' : 'space-y-2'}>
            {!isCollapsed && (
                <div className="px-3 text-xs uppercase tracking-wider text-gray-500">
                    {group.label}
                </div>
            )}
            {isCollapsed && showDivider && (
                <div className="border-t border-gray-800/40 my-2"></div>
            )}
            {group.items.map((item) => (
                <NavigationItem key={item.to} item={item} isCollapsed={isCollapsed} iconSize={iconSize} />
            ))}
        </div>
    );
};

export default NavigationGroup;
