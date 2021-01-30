const mongoose = require('mongoose');
const marked = require('marked');
const slugify = require('slugify');
const createDomPurify = require('dompurify');
const { JSDOM } = require('jsdom');
const dompurify = createDomPurify(new JSDOM().window);

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true
    },
    hashedPassword: {
        type: String,
        required: true
    },
    articles: [{
        title: { type: String, required: true},
        summary: { type: String },
        markdown: { type: String, required: true },
        createdAt: { type: Date, default: ()=> Date.now()},
        slug: { type: String, required: true, unique: true },
        sanitizedHtml: { type: String, required: true }
    }]
});

module.exports = mongoose.model('User', userSchema);