import List from '../models/List.js';
import Card from '../models/Card.js';
import Project from '../models/Project.js';
import Notification from '../models/Notification.js';


export const getBoard = async (req, res) => {
    try {
        const { projectId } = req.params;

        // 1. Fetch Lists (Sorted by order)
        const lists = await List.find({ projectId }).sort('order');
        
        // 2. Fetch Cards (Sorted by order)
        const cards = await Card.find({ projectId }).sort('order').populate('assignees', 'fullname avatar');

        res.json({ lists, cards });
    } catch (error) {
        res.status(500).json({ message: "Server Error" });
    }
};


export const createList = async (req, res) => {
    try {
        const { title, projectId } = req.body;
        
        // Find highest order to put this at the end
        const lastList = await List.findOne({ projectId }).sort('-order');
        const newOrder = lastList ? lastList.order + 1 : 0;

        const list = await List.create({
            title,
            projectId,
            order: newOrder
        });

        res.status(201).json(list);
    } catch (error) {
        res.status(500).json({ message: "Server Error" });
    }
};


export const createCard = async (req, res) => {
    try {
        const { title, listId, projectId } = req.body;

        // Find highest order in this list
        const lastCard = await Card.findOne({ listId }).sort('-order');
        const newOrder = lastCard ? lastCard.order + 1 : 0;

        const card = await Card.create({
            title,
            listId,
            projectId,
            order: newOrder
        });

        res.status(201).json(card);
    } catch (error) {
        res.status(500).json({ message: "Server Error" });
    }
};


export const updateCardOrder = async (req, res) => {
    try {
        const { cardId, newListId, newOrder } = req.body;

        // Update the card
        await Card.findByIdAndUpdate(cardId, {
            listId: newListId,
            order: newOrder
        });

        res.json({ message: "Order updated" });
    } catch (error) {
        res.status(500).json({ message: "Server Error" });
    }
};



export const deleteCard = async (req, res) => {
    try {
        const { id } = req.params;
        await Card.findByIdAndDelete(id);
        res.json({ message: "Card deleted" });
    } catch (error) {
        res.status(500).json({ message: "Server Error" });
    }
};



export const updateCard = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, description, dueDate, assignees } = req.body;

        // Find card
        const card = await Card.findById(id);
        if (!card) return res.status(404).json({ message: "Card not found" });

        // Update Text Fields
        if (title) card.title = title;
        if (description !== undefined) card.description = description;
        if (dueDate !== undefined) card.dueDate = dueDate;
        
        // Update Assignees
        if (assignees) {
            const newAssignees = Array.isArray(assignees) ? assignees : JSON.parse(assignees);
            
            // Find who is NEWLY assigned
            const previousAssignees = card.assignees.map(id => id.toString());
            const addedUsers = newAssignees.filter(id => !previousAssignees.includes(id));

            card.assignees = newAssignees;

            // Send Notifications to new assignees
            const io = req.app.get('io'); // Get Socket Instance

            addedUsers.forEach(async (userId) => {
                // Don't notify if assigning self
                if (userId !== req.user._id.toString()) {
                    
                    // 1. Create DB Record
                    const notif = await Notification.create({
                        recipient: userId,
                        sender: req.user._id,
                        message: `assigned you to task "${card.title}"`,
                        type: 'assignment',
                        relatedId: card._id
                    });

                    // 2. Send Real-time Socket Event
                    // We emit to the user's specific room (we need to make sure frontend joins it)
                    io.emit("new_notification", { 
                        ...notif._doc,
                        recipient: userId, // Frontend will filter this
                        sender: { fullname: req.user.fullname } 
                    });
                }
            });
        }

        // Handle File Upload (if a file was sent)
        if (req.file) {
            // We store the Cloudinary URL
           
            if (!card.attachments) card.attachments = [];
            card.attachments.push(req.file.path); 
        }

        await card.save();
        
        // Populate assignees to show their names immediately on frontend
        await card.populate('assignees', 'fullname avatar');

        res.json(card);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server Error" });
    }
};