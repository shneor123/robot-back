const express = require('express')
const { requireAuth, requireAdmin } = require('../../middlewares/require.auth.middleware')
const { getReviews, getReviewById, addReview, updateReview, removeReview } = require('./review.controller')

const router = express.Router()

module.exports = router

router.get('/', getReviews)
router.get('/:reviewId', getReviewById)
router.post('/', requireAuth, addReview)
router.put('/', requireAdmin, updateReview)
router.delete('/:reviewId', requireAdmin, removeReview)