const multer = require("multer")

function multerConfig(){
    const storage = multer.diskStorage({

        filename: function (req, file, cb) {
          cb(null, file.originalname)
        }
    })
    const upload = multer({
        storage: storage,
    })

    return {upload, multer}
}

module.exports = multerConfig;