import InboxMenu from '../notification/InboxMenu';

const TopBar = () => {
    return (
        <header className="h-16 bg-white flex items-center justify-end px-8 shadow-sm">
            <div className="flex items-center gap-3">
                <InboxMenu />
            </div>
        </header>
    );
};

export default TopBar;
