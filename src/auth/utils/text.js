const createdYear = new Date().getFullYear();
const copyrightYear = createdYear > 2022 ? `2022 - ${new Date().getFullYear()}` : '2022'

const text = {
    linkText: (name, bio, bg, url, data, type, linktext) => {

        const text = `
            <div style="font-size: .8rem; border: 2px solid #aaa; box-sizing: border-box; margin: 0; background: #fff; height: 70vh; padding: 10px">

                <div style="text-align:center; height: 70px; background: ${bg}">
                    <h2 style="font-weight: bold; color: #ddd; padding:3px 3px 0 3px; margin:0">
                        ${name}
                    </h2>
                    <small style="color: #333; width: 100%; font-size: 0.65rem; font-style: italic; font-weight: 600;">
                        ${bio}
                    </small>
                </div>

                <div style="height: calc(100% - 70px - 40px - 20px - 10px - 10px); width:100%">
                    <div style="text-align: center; padding: 50px 10px 20px 10px">
                        ${type === 'password' ? ` Someone requested a password reset for your account. If this was not you, please disregard this email. If you'd like to continue, click the link below. This link will expire in 24 hours` :
                `Thanks <span style="font-weight: bold">${data.username}</span> for registering with ${name}`
            }
                        
                    </div>

                    <div style="text-align:center">
                        <a style="display:block; text-align:center; padding: 15px; font-weight: 600" href="${url}">${linktext}</a>
                    </div>

                    <div style="text-align: center; margin: 5px 0; padding:10px">${url}</div>
                </div>

                <div style="text-align:center; height: 40px; padding: 10px; background: ${bg}">
                    <div style="color: #fff; padding: 0; margin:0">
                        &copy; ${copyrightYear} ${name}
                    <div>
                </div>

            </div>
        `

        return text;
    },

    otherText: () => {

    }

}
module.exports = text