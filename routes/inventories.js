const express = require('express');
const router = express.Router();
const {
    getAllInventories,
    getInventoryById,
    addStock,
    removeStock,
    reservation,
    sold
} = require('../controllers/inventories');

router.get('/', getAllInventories);
router.get('/:id', getInventoryById);
router.post('/add_stock', addStock);
router.post('/remove_stock', removeStock);
router.post('/reservation', reservation);
router.post('/sold', sold);

module.exports = router;
