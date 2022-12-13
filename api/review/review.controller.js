const reviewService = require('./review.service.mongodb')
// const reviewService = require('./review.service.sql')
// const logger = require('../../services/logger.service')

module.exports = {
    getReviews,
    getReviewById,
    addReview,
    updateReview,
    removeReview
}

async function getReviews(req, res) {
    try {
        const filterBy = req.query
        const reviews = await reviewService.query(filterBy || '{}')
        res.send(reviews)
    } catch (err) {
        // logger.error('Failed to get reviews', err)
        res.status(500).send('Failed to get reviews')
    }
}

async function getReviewById(req, res) {
    try {
        const review = await reviewService.getById(req.params.reviewId)
        if (!review) return res.status(401).send('Failed to get review')
        res.send(review)
    } catch (err) {
        // logger.error('Failed to get review', err)
        res.status(500).send('Failed to get review')
    }
}

async function addReview(req, res) {
    try {
        const review = req.body
        const savedReview = await reviewService.add(review)
        if (!savedReview) return res.status(401).send('Failed to add review')
        res.send(savedReview)
    } catch (err) {
        // logger.error('Failed to add review', err)
        res.status(500).send('Failed to add review')
    }
}

async function updateReview(req, res) {
    try {
        const review = req.body
        const savedReview = await reviewService.update(review)
        if (!savedReview) return res.status(401).send('Failed to update review')
        res.send(savedReview)
    } catch (err) {
        // logger.error('Failed to update review', err)
        res.status(500).send('Failed to update review')
    }
}

async function removeReview(req, res) {
    try {
        const deletedCount = await reviewService.remove(req.params.reviewId)
        if (!deletedCount) return res.status(401).send('Failed to remove review')
        res.send('Review removed successfully')
    } catch (err) {
        // logger.error('Failed to remove review', err)
        res.status(500).send('Failed to remove review')
    }
}