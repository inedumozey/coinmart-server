const mongoose = require('mongoose')
const User = mongoose.model("User");
const Config = mongoose.model("Config");
const Profile = mongoose.model("Profile")
require("dotenv").config();

const multerConfig = require("../../config/multer");
const path = require("path")
const fs = require("fs")
const cloudinary = require("cloudinary");

module.exports = {
    updateProfileImage: async (req, res) => {
        try {
            // image
            const { upload, multer } = multerConfig()
            const userId = req.user;
            // find the profile id from User collection
            let user = await User.findOne({ _id: userId });

            // find the profile of this user
            user = await Profile.findOne({ id: user.profile });

            let imageFileType = /png|jpg|jpeg/

            upload.single('file')(req, res, async (err) => {
                try {

                    if (!req.file) {
                        return res.status(402).json({ status: false, msg: "Empty file" })
                    }

                    const extType = path.extname(req.file.originalname)
                    const mimeType = req.file.mimetype

                    const isImage = imageFileType.test(extType) || imageFileType.test(mimeType)

                    if (!isImage) {
                        return res.status(402).json({ status: false, msg: "Supported files are PNG, JPG and JPEG" })

                    } else if (err instanceof multer.MulterError) {
                        return res.status(402).json({ status: false, msg: err.message })

                    } else if (err) {
                        return res.status(402).json({ status: false, msg: err.message })

                    } else {

                        const filePath = req.file.path

                        // get all config
                        const config = await Config.find({});

                        const appName = config[0].name // get the name of the app and use it as media folder on cloudinary


                        // update profile pic on cloudinary
                        //1. delete the file from cloudinary using the public id if it exist
                        user.profilePicPublicId ? await cloudinary.v2.uploader.destroy(user.profilePicPublicId, { invalidate: true }) : ""

                        // 2. upload the new file
                        const result = await cloudinary.v2.uploader.upload(filePath, {
                            folder: `${appName}/profile`,
                            eager: [
                                { width: 300, height: 300, crop: 'pad' }
                            ]
                        })

                        // update User database with the secure_url from cloudinary
                        await Profile.findOneAndUpdate({ _id: userId }, {
                            $set: {
                                profilePicUrl: result.eager[0].secure_url,
                                profilePicPublicId: result.public_id,
                            }
                        })

                        // remove the file path
                        fs.unlinkSync(filePath)

                        return res.status(200).json({ status: true, msg: "Successful", data })
                    }
                }
                catch (err) {
                    return res.status(500).json({ status: false, msg: err.message })
                }
            })
        }
        catch (err) {
            return res.status(500).json({ status: false, msg: err.message })
        }
    },

    updateDoc: async (req, res) => {
        try {
            // image
            const { upload, multer } = multerConfig()
            const userId = req.user;
            // find the profile id from User collection
            let user = await User.findOne({ _id: userId });

            // find the profile of this user
            user = await Profile.findOne({ id: user.profile });

            let imageFileType = /png|jpg|jpeng/

            upload.single('file')(req, res, async (err) => {
                try {

                    if (!req.file) {
                        return res.status(402).json({ status: false, msg: "Empty file" })
                    }

                    const extType = path.extname(req.file.originalname)
                    const mimeType = req.file.mimetype

                    const isImage = imageFileType.test(extType) || imageFileType.test(mimeType)

                    if (!isImage) {
                        return res.status(402).json({ status: false, msg: "Invalid file type" })

                    } else if (err instanceof multer.MulterError) {
                        return res.status(402).json({ status: false, msg: err.message })

                    } else if (err) {
                        return res.status(402).json({ status: false, msg: err.message })

                    } else {

                        const filePath = req.file.path

                        // get all config
                        const config = await Config.find({});

                        const appName = config[0].name // get the name of the app and use it as media folder on cloudinary


                        // update profile pic on cloudinary
                        //1. delete the file from cloudinary using the public id if it exist
                        user.docPublicId ? await cloudinary.v2.uploader.destroy(user.docPublicId, { invalidate: true }) : ""

                        // 2. upload the new file
                        const result = await cloudinary.v2.uploader.upload(filePath, {
                            folder: `${appName}/profile`,
                            eager: [
                                { width: 300, height: 300, crop: 'pad' }
                            ]
                        })

                        // update User database with the secure_url from cloudinary
                        await Profile.findOneAndUpdate({ _id: userId }, {
                            $set: {
                                docUrl: result.eager[0].secure_url,
                                docPublicId: result.public_id,
                            }
                        })

                        // remove the file path
                        fs.unlinkSync(filePath)

                        return res.status(200).json({ status: true, msg: "Successful", data })
                    }
                }
                catch (err) {
                    return res.status(500).json({ status: false, msg: err.message })
                }
            })
        }
        catch (err) {
            return res.status(500).json({ status: false, msg: err.message })
        }
    },

    update2fa: async (req, res) => {
        try {


        }
        catch (err) {
            return res.status(500).json({ status: false, msg: err.message })
        }
    },

}
