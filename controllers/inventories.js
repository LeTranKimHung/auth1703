const inventorySchema = require('../schemas/inventories');

const getAllInventories = async (req, res) => {
    try {
        const inventories = await inventorySchema.find().populate('product');
        res.status(200).json(inventories);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getInventoryById = async (req, res) => {
    try {
        const inventory = await inventorySchema.findById(req.params.id).populate('product');
        if (!inventory) {
            return res.status(404).json({ message: 'Inventory not found' });
        }
        res.status(200).json(inventory);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const addStock = async (req, res) => {
    try {
        const { product, quantity } = req.body;
        const inventory = await inventorySchema.findOne({ product });
        if (!inventory) {
            return res.status(404).json({ message: 'Inventory for product not found' });
        }
        inventory.stock += Number(quantity);
        await inventory.save();
        res.status(200).json(inventory);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const removeStock = async (req, res) => {
    try {
        const { product, quantity } = req.body;
        const inventory = await inventorySchema.findOne({ product });
        if (!inventory) {
            return res.status(404).json({ message: 'Inventory for product not found' });
        }
        if (inventory.stock < quantity) {
            return res.status(400).json({ message: 'Not enough stock' });
        }
        inventory.stock -= Number(quantity);
        await inventory.save();
        res.status(200).json(inventory);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const reservation = async (req, res) => {
    try {
        const { product, quantity } = req.body;
        const inventory = await inventorySchema.findOne({ product });
        if (!inventory) {
            return res.status(404).json({ message: 'Inventory for product not found' });
        }
        if (inventory.stock < quantity) {
            return res.status(400).json({ message: 'Not enough stock to reserve' });
        }
        inventory.stock -= Number(quantity);
        inventory.reserved += Number(quantity);
        await inventory.save();
        res.status(200).json(inventory);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const sold = async (req, res) => {
    try {
        const { product, quantity } = req.body;
        const inventory = await inventorySchema.findOne({ product });
        if (!inventory) {
            return res.status(404).json({ message: 'Inventory for product not found' });
        }
        if (inventory.reserved < quantity) {
            return res.status(400).json({ message: 'Not enough reserved stock to sell' });
        }
        inventory.reserved -= Number(quantity);
        inventory.soldCount += Number(quantity);
        await inventory.save();
        res.status(200).json(inventory);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getAllInventories,
    getInventoryById,
    addStock,
    removeStock,
    reservation,
    sold
};
