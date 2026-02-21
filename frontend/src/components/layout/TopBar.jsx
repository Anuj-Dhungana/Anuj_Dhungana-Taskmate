import InboxMenu from '../notification/InboxMenu';

const TopBar = () => {
    return (
        <header className="h-16 flex items-center justify-end px-8 border-b border-gray-800/70 bg-linear-to-b from-gray-950 to-gray-900">
            <div className="flex items-center gap-3">
                <InboxMenu />
            </div>
        </header>
    );
};

export default TopBar;
